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

// ===============================================================
// Reward issuance (phase 2)
// ===============================================================
//
// When a referee makes their first PAID booking, both sides earn
// a coupon. The flow is:
//
//   1. Stripe webhook flips booking → PAID
//   2. Webhook calls qualifyAndIssueRewards(refereeEmail, bookingId)
//   3. We look up the user behind that email
//   4. Find a 'pending' referral row keyed on that user
//   5. Atomically claim it (UPDATE ... WHERE status='pending') so
//      concurrent webhooks can't double-issue
//   6. Insert two coupon rows — one bound to each side's email —
//      and write the codes back to the referrals row
//   7. Send notification emails to both sides (best-effort)
//
// The whole thing is wrapped so any error → log + return. A
// reward-issuance failure must NEVER prevent a booking from
// being marked PAID. Worst case: an admin re-issues the reward
// manually using the audit trail.

const REWARD_CODE_PREFIX = 'GIFT'
const REWARD_CODE_RANDOM_LEN = 8

// Coupon parameters. Tunable via env if you want to change the
// program economics without redeploying — but defaults are sane.
const REWARD_DISCOUNT_PERCENT = Number(
  process.env.REFERRAL_REWARD_PERCENT || 10
)
const REWARD_MAX_DISCOUNT_THB = Number(
  process.env.REFERRAL_REWARD_MAX_THB || 500
)
const REWARD_VALID_DAYS = Number(process.env.REFERRAL_REWARD_DAYS || 90)

function generateRewardCode(): string {
  let out = REWARD_CODE_PREFIX + '-'
  for (let i = 0; i < REWARD_CODE_RANDOM_LEN; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

interface QualifiedReward {
  status: 'rewarded'
  referralId: string
  referrerEmail: string
  referrerName: string | null
  refereeEmail: string
  refereeName: string | null
  referrerCouponCode: string
  refereeCouponCode: string
}

interface QualifyOutcome {
  status:
    | 'rewarded' // success — both coupons issued, emails will fire
    | 'no_referral' // referee not part of any referral
    | 'already_processed' // race-lost — another worker handled it
    | 'unknown_user' // email doesn't map to a registered user
    | 'error' // unexpected DB failure (already logged)
  reward?: QualifiedReward
}

/**
 * Best-effort: qualify the referee for rewards if they have a
 * pending referral, issue coupons to both sides.
 *
 * @param refereeEmail — the customer_email on the booking
 * @param bookingId — for audit context only; not persisted here
 *
 * Never throws. Logs internally. Returns a status the caller
 * can use to fire emails / log audit, but the caller is free
 * to ignore the return.
 */
export async function qualifyAndIssueRewards(
  refereeEmail: string,
  bookingId: string | null
): Promise<QualifyOutcome> {
  if (!refereeEmail) return { status: 'unknown_user' }

  try {
    const supabase = await createAdminClient()

    // 1. Resolve referee user. If they booked as a guest with an
    //    email that isn't registered, no reward — referral system
    //    is for tracked users only.
    const { data: refereeRaw } = await supabase
      .from('users')
      .select('id, email, name')
      .ilike('email', refereeEmail.trim())
      .maybeSingle()
    const referee = refereeRaw as
      | { id: string; email: string; name: string | null }
      | null
    if (!referee) return { status: 'unknown_user' }

    // 2. Find a pending referral row keyed on this referee.
    const { data: pendingRaw } = await supabase
      .from('referrals')
      .select('id, referrer_id, referee_id, status')
      .eq('referee_id', referee.id)
      .eq('status', 'pending')
      .maybeSingle()
    const pending = pendingRaw as {
      id: string
      referrer_id: string
      referee_id: string
      status: string
    } | null
    if (!pending) return { status: 'no_referral' }

    // 3. Atomically claim qualification. Conditional UPDATE
    //    prevents concurrent webhooks from both winning.
    const nowIso = new Date().toISOString()
    const { data: claimedRaw, error: claimErr } = await supabase
      .from('referrals')
      .update({ status: 'qualified', qualified_at: nowIso })
      .eq('id', pending.id)
      .eq('status', 'pending')
      .select('id')

    if (claimErr) {
      logger.error('referral: qualify claim failed', {
        referralId: pending.id,
        bookingId,
        error: claimErr.message,
      })
      return { status: 'error' }
    }

    const claimed = (claimedRaw as Array<{ id: string }> | null) || []
    if (claimed.length === 0) {
      // Another worker beat us to it. Not an error.
      return { status: 'already_processed' }
    }

    // 4. Resolve referrer for email/name.
    const { data: referrerRaw } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', pending.referrer_id)
      .maybeSingle()
    const referrer = referrerRaw as
      | { id: string; email: string; name: string | null }
      | null
    if (!referrer) {
      logger.error('referral: referrer user missing after qualify', {
        referralId: pending.id,
      })
      return { status: 'error' }
    }

    // 5. Generate coupon codes + insert. Retry on rare unique
    //    collisions (4 attempts is enough at our entropy).
    const referrerCode = await issueRewardCoupon(supabase, {
      email: referrer.email,
      source: 'referral_referrer',
      description: 'Referral reward — thanks for inviting a friend',
    })
    const refereeCode = await issueRewardCoupon(supabase, {
      email: referee.email,
      source: 'referral_referee',
      description: 'Welcome gift — thanks for trying us out',
    })

    if (!referrerCode || !refereeCode) {
      logger.error('referral: coupon insert failed; reward incomplete', {
        referralId: pending.id,
        bookingId,
      })
      // Leave the referral in 'qualified' so an admin can retry
      // by hand. Don't roll back to 'pending' — the qualifying
      // booking has already been paid.
      return { status: 'error' }
    }

    // 6. Stamp the codes on the referrals row + flip to rewarded.
    const { error: stampErr } = await supabase
      .from('referrals')
      .update({
        referrer_coupon_code: referrerCode,
        referee_coupon_code: refereeCode,
        status: 'rewarded',
        rewarded_at: new Date().toISOString(),
      })
      .eq('id', pending.id)

    if (stampErr) {
      logger.error('referral: rewarded stamp failed (coupons issued)', {
        referralId: pending.id,
        error: stampErr.message,
      })
      // Coupons are usable; row is in an awkward 'qualified' state
      // but admin can reconcile. Continue so emails still fire.
    }

    return {
      status: 'rewarded',
      reward: {
        status: 'rewarded',
        referralId: pending.id,
        referrerEmail: referrer.email,
        referrerName: referrer.name,
        refereeEmail: referee.email,
        refereeName: referee.name,
        referrerCouponCode: referrerCode,
        refereeCouponCode: refereeCode,
      },
    }
  } catch (err) {
    logger.error('referral: qualifyAndIssueRewards threw', {
      bookingId,
      error: err instanceof Error ? err.message : String(err),
    })
    return { status: 'error' }
  }
}

/**
 * Insert a single email-bound reward coupon. Returns the code
 * on success, null on failure. Retries on unique-code collision.
 */
async function issueRewardCoupon(
  supabase: any,
  input: { email: string; source: string; description: string }
): Promise<string | null> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REWARD_VALID_DAYS)

  for (let attempt = 0; attempt < 4; attempt++) {
    const code = generateRewardCode()
    const { error } = await supabase.from('coupons').insert({
      code,
      description: input.description,
      discount_type: 'PERCENT',
      discount_value: REWARD_DISCOUNT_PERCENT,
      max_discount: REWARD_MAX_DISCOUNT_THB,
      min_spend: 0,
      applies_to: 'ALL',
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
      bound_to_email: input.email.trim().toLowerCase(),
      source: input.source,
    })

    if (!error) return code

    // 23505 = code collision; retry. Anything else: bail out.
    const errCode = (error as { code?: string }).code
    if (errCode !== '23505') {
      logger.error('referral: coupon insert error', {
        source: input.source,
        error: error.message,
      })
      return null
    }
  }

  logger.error('referral: coupon insert exhausted retries', {
    source: input.source,
  })
  return null
}

/**
 * Admin action — flip a referral to 'voided'. Used when the
 * admin spots fraud (e.g. someone made multiple accounts to
 * self-refer). Does NOT revoke already-issued coupons — that's
 * a separate action via the coupon admin UI, because the admin
 * may want to keep one side's reward and only void the other.
 */
export async function voidReferral(referralId: string): Promise<{
  ok: boolean
  reason?: string
}> {
  if (!referralId) return { ok: false, reason: 'missing_id' }

  try {
    const supabase = await createAdminClient()
    const { data: updatedRaw, error } = await supabase
      .from('referrals')
      .update({ status: 'voided' })
      .eq('id', referralId)
      .neq('status', 'voided')
      .select('id')

    if (error) {
      logger.error('referral: void failed', {
        referralId,
        error: error.message,
      })
      return { ok: false, reason: 'db_error' }
    }
    const updated = (updatedRaw as Array<{ id: string }> | null) || []
    if (updated.length === 0) {
      return { ok: false, reason: 'not_found_or_already_voided' }
    }
    return { ok: true }
  } catch (err) {
    logger.error('referral: void threw', {
      referralId,
      error: err instanceof Error ? err.message : String(err),
    })
    return { ok: false, reason: 'exception' }
  }
}
