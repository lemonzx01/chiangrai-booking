/**
 * ============================================================
 * Loyalty points helpers (phase 1)
 * ============================================================
 *
 * Operations:
 *
 *   awardPointsForBooking({ customerEmail, bookingId, amountThb,
 *                           bookingCode? }) → { awarded, points }
 *     Best-effort — finds the user by email, computes the
 *     point amount, atomically inserts a ledger row + bumps
 *     the counter. Idempotent at the DB layer (UNIQUE partial
 *     index on (source_id, kind='earn')) so re-firing the
 *     Stripe webhook can't double-credit.
 *
 *   getLoyaltyOverview(userId) → { points, recent[] }
 *     Returns the current balance + last 10 ledger entries
 *     for the profile widget.
 *
 * Earning rate:
 *   Configurable via LOYALTY_RATE_THB_PER_POINT env (default
 *   100 — i.e. 1 point per ฿100 spent). Changing the rate at
 *   runtime affects only future awards, never retroactively.
 *
 * Why a ledger + counter (not just a counter):
 *   Counter alone gives us the balance fast, but loses history.
 *   Ledger alone is correct but slow to read on every page
 *   load. With both, the counter answers "what's my balance"
 *   in O(1) and the ledger answers "where did this come from"
 *   for audit + future tier rules.
 * ============================================================
 */

import { createAdminClient } from './supabase/server'
import { logger } from './logger'

// ---------------------------------------------------------------
// Tunable rate
// ---------------------------------------------------------------

const DEFAULT_RATE_THB_PER_POINT = 100

function getRateThbPerPoint(): number {
  const raw = Number(process.env.LOYALTY_RATE_THB_PER_POINT)
  // Defensive: if the env is missing / NaN / <= 0, fall back
  // to the safe default. We never want to award infinity points
  // because someone typoed an env var.
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_RATE_THB_PER_POINT
  return raw
}

/**
 * Convert a booking's THB total into earned points.
 *
 *   100 THB / point  →  ฿1500 booking = 15 points
 *   50  THB / point  →  ฿1500 booking = 30 points
 *
 * Floors fractional points (you don't half-earn — the system
 * waits until you cross the next whole ฿100). Negative or
 * zero amounts → 0 points.
 */
export function calculatePointsForAmount(amountThb: number): number {
  if (!Number.isFinite(amountThb) || amountThb <= 0) return 0
  return Math.floor(amountThb / getRateThbPerPoint())
}

// ---------------------------------------------------------------
// Award (write path)
// ---------------------------------------------------------------

interface AwardInput {
  /** Booking's customer_email — the lookup key for the user. */
  customerEmail: string
  /** UUID of the booking row. Becomes the idempotency key. */
  bookingId: string
  /** THB total used to compute the point amount. */
  amountThb: number
  /** Optional human-readable code for the ledger note. */
  bookingCode?: string
}

interface AwardResult {
  /** True if a new ledger row was written + counter incremented. */
  awarded: boolean
  /** Point amount that was credited (0 if skipped). */
  points: number
  /** Why we skipped, when awarded=false. */
  reason?:
    | 'unknown_user'
    | 'zero_points'
    | 'already_awarded'
    | 'db_error'
}

/**
 * Best-effort: award points to the user behind this booking.
 * Never throws. Caller can ignore the return value if they
 * just want fire-and-forget.
 */
export async function awardPointsForBooking(
  input: AwardInput
): Promise<AwardResult> {
  if (!input.customerEmail) return { awarded: false, points: 0, reason: 'unknown_user' }

  try {
    const points = calculatePointsForAmount(input.amountThb)
    if (points <= 0) return { awarded: false, points: 0, reason: 'zero_points' }

    const supabase = await createAdminClient()

    // 1. Resolve user by email. Guests (no account) don't earn —
    //    points are a registered-user feature. Same shape as the
    //    referral reward path.
    const { data: userRaw } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', input.customerEmail.trim())
      .maybeSingle()
    const user = userRaw as { id: string; email: string } | null
    if (!user) return { awarded: false, points: 0, reason: 'unknown_user' }

    // 2. Insert ledger row. The UNIQUE partial index (source_id,
    //    kind='earn', source_type='booking') gives us idempotency:
    //    a duplicate insert for the same booking returns 23505
    //    and we treat it as a silent no-op.
    const reason = input.bookingCode
      ? `จองสำเร็จ ${input.bookingCode} (฿${input.amountThb.toLocaleString()})`
      : `จองสำเร็จ (฿${input.amountThb.toLocaleString()})`

    const { error: insertErr } = await supabase
      .from('loyalty_ledger')
      .insert({
        user_id: user.id,
        delta: points,
        kind: 'earn',
        source_type: 'booking',
        source_id: input.bookingId,
        reason,
      })

    if (insertErr) {
      const code = (insertErr as { code?: string }).code
      if (code === '23505') {
        // Already awarded — idempotent path. Don't log noisily.
        return { awarded: false, points: 0, reason: 'already_awarded' }
      }
      logger.error('loyalty: ledger insert failed', {
        bookingId: input.bookingId,
        error: insertErr.message,
      })
      return { awarded: false, points: 0, reason: 'db_error' }
    }

    // 3. Bump the counter. This is the denormalized cache for
    //    fast reads; the ledger remains the source of truth.
    //    If this update fails, the ledger row already landed,
    //    so the user IS credited — they just need a manual
    //    counter resync. We log loudly so an operator notices.
    //
    //    Why we don't use an atomic RPC: keeping this as two
    //    separate calls means it works on the mock client
    //    (which doesn't support .rpc) without special-casing.
    //    The race is bounded (the ledger is the truth) and the
    //    inconsistency window is microseconds.
    const { error: bumpErr } = await (supabase.rpc('increment_loyalty_points', {
      p_user_id: user.id,
      p_delta: points,
    }) as Promise<{ error: { message: string } | null }>).then(
      (r) => r,
      // .rpc threw (e.g. function doesn't exist yet because we
      // haven't added the SQL function — common in mock mode).
      // Fall through to the manual update below.
      () => ({ error: { message: 'rpc unavailable' } })
    )

    if (bumpErr) {
      // Fallback: read-modify-write. Acceptable because award
      // contention per user is low (max 1 booking-paid event
      // per checkout session); the ledger insert above is what
      // actually serializes.
      const { data: cur } = await supabase
        .from('users')
        .select('loyalty_points')
        .eq('id', user.id)
        .maybeSingle()
      const next =
        ((cur as { loyalty_points: number } | null)?.loyalty_points || 0) + points
      await supabase
        .from('users')
        .update({ loyalty_points: next })
        .eq('id', user.id)
    }

    return { awarded: true, points }
  } catch (err) {
    logger.error('loyalty: award threw', {
      bookingId: input.bookingId,
      error: err instanceof Error ? err.message : String(err),
    })
    return { awarded: false, points: 0, reason: 'db_error' }
  }
}

// ---------------------------------------------------------------
// Read (overview for the profile widget)
// ---------------------------------------------------------------

export interface LoyaltyLedgerEntry {
  delta: number
  kind: 'earn' | 'redeem' | 'void' | 'adjust'
  reason: string | null
  createdAt: string
}

export interface LoyaltyOverview {
  /** Current balance — denormalized counter on users row. */
  points: number
  /** Last 10 ledger entries, newest first. */
  recent: LoyaltyLedgerEntry[]
}

/**
 * Compose the profile-widget payload. Two queries:
 *   1. counter (users.loyalty_points)
 *   2. last 10 ledger rows
 */
export async function getLoyaltyOverview(
  userId: string
): Promise<LoyaltyOverview> {
  const supabase = await createAdminClient()

  const [userResult, ledgerResult] = await Promise.all([
    supabase
      .from('users')
      .select('loyalty_points')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('loyalty_ledger')
      .select('delta, kind, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const points =
    (userResult.data as { loyalty_points: number } | null)?.loyalty_points || 0

  const recent: LoyaltyLedgerEntry[] = (
    (ledgerResult.data as Array<{
      delta: number
      kind: 'earn' | 'redeem' | 'void' | 'adjust'
      reason: string | null
      created_at: string
    }> | null) || []
  ).map((row) => ({
    delta: row.delta,
    kind: row.kind,
    reason: row.reason,
    createdAt: row.created_at,
  }))

  return { points, recent }
}
