/**
 * ============================================================
 * Referral program helpers
 * ============================================================
 *
 * Operations:
 *   - getOrCreateReferralCode(userId) → string
 *     Lazy-generates the user's code on first need, stores it
 *     on users.referral_code, and returns. Subsequent calls
 *     are a single SELECT.
 *
 *   - resolveReferrer(code) → user row | null
 *     Looks up a user by their referral code. Used by the
 *     register endpoint to attribute new signups.
 *
 *   - recordReferral({referrerId, refereeId, code})
 *     Inserts the (referrer, referee) row in 'pending' state.
 *     Idempotent: if the referee already has a row (someone
 *     else's code claimed them first), this is a no-op —
 *     first attribution wins.
 *
 *   - getReferralStats(userId)
 *     Returns the user's code + counts (pending / qualified /
 *     rewarded / total) for the profile page.
 *
 * Code format:
 *   8 chars from a confusion-resistant alphabet (no 0/O,
 *   1/I/l). Roughly 32^8 ≈ 1 trillion combinations, so the
 *   chance of two users picking the same code by random
 *   collision is negligible at any realistic scale. We still
 *   retry on UNIQUE violation just in case.
 * ============================================================
 */

import { createAdminClient } from './supabase/server'
import { logger } from './logger'

// Confusion-resistant alphabet — drops 0/O, 1/I/l, and the
// usual lowercase look-alikes. 32 characters, base32-ish.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const CODE_LENGTH = 8
const MAX_GENERATE_ATTEMPTS = 5

function generateCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

interface UserRow {
  id: string
  referral_code: string | null
}

/**
 * Lazy code generation. Returns the existing code if set;
 * otherwise picks a fresh one and stores it on the user row.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const supabase = await createAdminClient()

  // Check first — most calls hit this path.
  const { data: existingRaw } = await supabase
    .from('users')
    .select('id, referral_code')
    .eq('id', userId)
    .maybeSingle()
  const existing = existingRaw as UserRow | null

  if (existing?.referral_code) {
    return existing.referral_code
  }

  // Generate + write. Retry on UNIQUE violation up to 5 times
  // — at 32^8 entropy collisions are astronomically rare but
  // we'd rather degrade gracefully than throw.
  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt++) {
    const code = generateCode()
    const { error } = await supabase
      .from('users')
      .update({ referral_code: code })
      .eq('id', userId)
      // Only set if it's still null — prevents overwriting a
      // code another concurrent request already assigned.
      .is('referral_code', null)

    // Re-read to confirm. Whoever's code "won" is the answer.
    const { data: afterRaw } = await supabase
      .from('users')
      .select('id, referral_code')
      .eq('id', userId)
      .maybeSingle()
    const after = afterRaw as UserRow | null

    if (after?.referral_code) {
      if (error) {
        // Conflict on someone else's code — retry. Otherwise
        // the after-read landed our own row, success.
        if (after.referral_code !== code) continue
      }
      return after.referral_code
    }
  }

  // Should be unreachable; if we got here, log and use the
  // last attempted code so the caller still gets a string.
  logger.error('referral: getOrCreateReferralCode exhausted retries', {
    userId,
  })
  return generateCode()
}

/**
 * Look up the user behind a referral code. Returns null if
 * the code is empty, malformed, or unrecognized.
 */
export async function resolveReferrer(
  code: string | null | undefined
): Promise<{ id: string; email: string; name: string } | null> {
  if (!code) return null
  // Defensive: trim + uppercase before lookup, since codes are
  // case-insensitive on input but case-sensitive in storage.
  const normalized = code.trim().toUpperCase()
  if (!normalized || normalized.length !== CODE_LENGTH) return null

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('referral_code', normalized)
    .maybeSingle()

  if (error) {
    logger.warn('referral: resolveReferrer query failed', {
      error: error.message,
    })
    return null
  }
  return (data as { id: string; email: string; name: string } | null) || null
}

interface RecordReferralInput {
  referrerId: string
  refereeId: string
  code: string
}

/**
 * Record a new referral relationship. Idempotent — if the
 * referee already has a row (someone else's code claimed them
 * first), this is a silent no-op.
 *
 * Self-referrals are caught by a CHECK constraint at the DB
 * layer, but we also reject them here so the helper has a
 * clean return shape.
 */
export async function recordReferral(input: RecordReferralInput): Promise<{
  recorded: boolean
  reason?: string
}> {
  if (input.referrerId === input.refereeId) {
    return { recorded: false, reason: 'self_referral' }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase.from('referrals').insert({
    referrer_id: input.referrerId,
    referee_id: input.refereeId,
    referral_code: input.code,
    status: 'pending',
  })

  if (error) {
    // 23505 = unique violation = referee already has a row.
    // First attribution wins — silent no-op, return cleanly.
    const code = (error as { code?: string }).code
    if (code === '23505') {
      return { recorded: false, reason: 'already_referred' }
    }
    logger.error('referral: recordReferral insert failed', {
      error: error.message,
    })
    return { recorded: false, reason: 'db_error' }
  }
  return { recorded: true }
}

interface ReferralStats {
  code: string
  shareUrl: string
  total: number
  pending: number
  qualified: number
  rewarded: number
  invitees: Array<{
    refereeName: string | null
    refereeEmail: string
    status: string
    createdAt: string
  }>
}

/**
 * Compose stats + invitees for the profile UI.
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const code = await getOrCreateReferralCode(userId)
  const supabase = await createAdminClient()

  const { data: rows } = await supabase
    .from('referrals')
    .select(
      `id, status, created_at,
       referee:users!referrals_referee_id_fkey(name, email)`
    )
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const list =
    (rows as Array<{
      id: string
      status: string
      created_at: string
      referee:
        | { name: string | null; email: string }
        | { name: string | null; email: string }[]
        | null
    }> | null) || []

  let pending = 0
  let qualified = 0
  let rewarded = 0
  const invitees: ReferralStats['invitees'] = []
  for (const row of list) {
    if (row.status === 'pending') pending++
    else if (row.status === 'qualified') qualified++
    else if (row.status === 'rewarded') rewarded++

    const ref = Array.isArray(row.referee) ? row.referee[0] : row.referee
    invitees.push({
      refereeName: ref?.name || null,
      refereeEmail: ref?.email
        ? maskEmailMidLocal(ref.email)
        : 'unknown',
      status: row.status,
      createdAt: row.created_at,
    })
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://gotjourneythailand.com'
  ).replace(/\/$/, '')

  return {
    code,
    shareUrl: `${siteUrl}/register?ref=${encodeURIComponent(code)}`,
    total: list.length,
    pending,
    qualified,
    rewarded,
    invitees,
  }
}

/**
 * Mask `john.doe@example.com` → `j***@example.com` so the
 * referrer can SEE that someone signed up without learning
 * their full email. Light privacy hedge — most referrers
 * already know the email of the friend they referred.
 */
function maskEmailMidLocal(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return '[hidden]'
  const local = email.slice(0, at)
  const domain = email.slice(at)
  const masked = local.length <= 2 ? '*' : local[0] + '***'
  return masked + domain
}
