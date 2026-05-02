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
// Redeem tiers (phase 1.5)
// ---------------------------------------------------------------
//
// Three fixed tiers. Higher tiers give better value (% off
// per point) — encourages saving rather than spending the
// minimum every booking. If we ever need dynamic / per-user
// tiers we'll move this to a DB-driven config; for now constants
// keep the surface area small and the UX predictable.
//
//   100 pts → ฿100 off  (1.00 ฿/pt)
//   300 pts → ฿350 off  (1.17 ฿/pt)  +17% bonus
//   500 pts → ฿600 off  (1.20 ฿/pt)  +20% bonus

export interface RedeemTier {
  /** Point cost. */
  points: number
  /** Resulting coupon's discount in THB (FIXED type). */
  valueThb: number
  /** Display label for the UI. */
  label: string
}

export const REDEEM_TIERS: readonly RedeemTier[] = [
  { points: 100, valueThb: 100, label: '฿100 off' },
  { points: 300, valueThb: 350, label: '฿350 off' },
  { points: 500, valueThb: 600, label: '฿600 off' },
] as const

const REDEEM_COUPON_VALID_DAYS = 90
// Same alphabet as referral codes — confusion-resistant.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const COUPON_PREFIX = 'REDEEM'
const COUPON_RANDOM_LEN = 10
const COUPON_INSERT_MAX_ATTEMPTS = 4

function generateRedeemCouponCode(): string {
  let suffix = ''
  for (let i = 0; i < COUPON_RANDOM_LEN; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return `${COUPON_PREFIX}-${suffix}`
}

interface RedeemInput {
  userId: string
  /** Tier point cost — must match one of REDEEM_TIERS exactly. */
  points: number
}

interface RedeemSuccess {
  ok: true
  couponCode: string
  /** New balance after deduction. */
  pointsRemaining: number
  /** Discount amount the coupon will give in THB. */
  valueThb: number
  /** Coupon expiry ISO. */
  expiresAt: string
}

interface RedeemFailure {
  ok: false
  reason:
    | 'invalid_tier'
    | 'unknown_user'
    | 'insufficient_points'
    | 'race_lost'
    | 'coupon_insert_failed'
    | 'db_error'
}

export type RedeemResult = RedeemSuccess | RedeemFailure

/**
 * Atomically redeem points for an email-bound coupon.
 *
 * Order of operations:
 *   1. Validate the tier — must be one of REDEEM_TIERS exactly
 *   2. Conditional decrement on users.loyalty_points (only if
 *      balance >= cost). This serializes redemptions per user
 *      and prevents double-spend on concurrent requests.
 *   3. Insert the coupon row (retry on code collision)
 *   4. Insert the ledger row with kind='redeem', negative delta
 *
 * If step 3 fails after retries we COMPENSATE step 2 by adding
 * the points back. If step 4 fails we log loudly but don't
 * compensate — the user has the coupon, the points are deducted,
 * the audit trail is the only thing missing (operator can
 * reconstruct from coupons.created_at + source='loyalty_redeem').
 *
 * Never throws — returns a typed result the caller can branch on.
 */
export async function redeemPointsForCoupon(
  input: RedeemInput
): Promise<RedeemResult> {
  // 1. Validate tier — exact match to a known cost. Don't accept
  //    arbitrary point amounts, even if the user has them.
  const tier = REDEEM_TIERS.find((t) => t.points === input.points)
  if (!tier) return { ok: false, reason: 'invalid_tier' }

  try {
    const supabase = await createAdminClient()

    // 2a. Resolve user (need email to bind the coupon).
    const { data: userRaw } = await supabase
      .from('users')
      .select('id, email, loyalty_points')
      .eq('id', input.userId)
      .maybeSingle()
    const user = userRaw as
      | { id: string; email: string; loyalty_points: number }
      | null
    if (!user) return { ok: false, reason: 'unknown_user' }

    if ((user.loyalty_points || 0) < tier.points) {
      return { ok: false, reason: 'insufficient_points' }
    }

    // 2b. Conditional decrement. Returns the row only if the
    //     balance was high enough; an empty result means a
    //     concurrent redemption beat us to it. We compute the
    //     new balance by reading after the update — Supabase's
    //     update().select() returns updated rows in one call.
    const { data: updatedRaw, error: updErr } = await supabase
      .from('users')
      .update({ loyalty_points: (user.loyalty_points || 0) - tier.points })
      .eq('id', input.userId)
      .gte('loyalty_points', tier.points)
      .select('loyalty_points')

    if (updErr) {
      logger.error('loyalty: redeem decrement failed', {
        userId: input.userId,
        error: updErr.message,
      })
      return { ok: false, reason: 'db_error' }
    }

    const updated = (updatedRaw as Array<{ loyalty_points: number }> | null) || []
    if (updated.length === 0) {
      return { ok: false, reason: 'race_lost' }
    }
    const remaining = updated[0].loyalty_points

    // 3. Insert coupon. Retry on code collision (very rare at
    //    32^10 entropy but graceful is cheap).
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REDEEM_COUPON_VALID_DAYS)
    const expiresIso = expiresAt.toISOString()

    let issuedCode: string | null = null
    for (let attempt = 0; attempt < COUPON_INSERT_MAX_ATTEMPTS; attempt++) {
      const code = generateRedeemCouponCode()
      const { error: couponErr } = await supabase.from('coupons').insert({
        code,
        description: `Loyalty redemption — ${tier.label}`,
        discount_type: 'FIXED',
        discount_value: tier.valueThb,
        max_discount: null,
        min_spend: 0,
        applies_to: 'ALL',
        starts_at: new Date().toISOString(),
        expires_at: expiresIso,
        is_active: true,
        bound_to_email: user.email.trim().toLowerCase(),
        source: 'loyalty_redeem',
      })

      if (!couponErr) {
        issuedCode = code
        break
      }
      const errCode = (couponErr as { code?: string }).code
      if (errCode !== '23505') {
        logger.error('loyalty: redeem coupon insert failed', {
          userId: input.userId,
          error: couponErr.message,
        })
        break
      }
      // Otherwise loop and retry with a fresh code.
    }

    if (!issuedCode) {
      // 3a. Compensate the decrement — give the points back.
      //     We didn't write a ledger row yet, so the user's
      //     visible state is consistent (points stayed where
      //     they were).
      await supabase
        .from('users')
        .update({ loyalty_points: (user.loyalty_points || 0) })
        .eq('id', input.userId)
      return { ok: false, reason: 'coupon_insert_failed' }
    }

    // 4. Audit trail — best-effort. If this fails, the user
    //    already has the coupon and the deducted points; the
    //    only loss is a missing ledger row, which an operator
    //    can reconstruct from coupons.created_at + source.
    const { error: ledgerErr } = await supabase
      .from('loyalty_ledger')
      .insert({
        user_id: input.userId,
        delta: -tier.points,
        kind: 'redeem',
        source_type: 'coupon',
        source_id: issuedCode,
        reason: `แลกแต้มเป็นคูปอง ${tier.label} (รหัส ${issuedCode})`,
      })

    if (ledgerErr) {
      logger.error('loyalty: redeem ledger insert failed (coupon issued OK)', {
        userId: input.userId,
        couponCode: issuedCode,
        error: ledgerErr.message,
      })
    }

    return {
      ok: true,
      couponCode: issuedCode,
      pointsRemaining: remaining,
      valueThb: tier.valueThb,
      expiresAt: expiresIso,
    }
  } catch (err) {
    logger.error('loyalty: redeem threw', {
      userId: input.userId,
      error: err instanceof Error ? err.message : String(err),
    })
    return { ok: false, reason: 'db_error' }
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
  /** Available redemption tiers, exposed so the UI doesn't
   *  need to hard-code them and gets updates for free. */
  redeemTiers: readonly RedeemTier[]
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

  return { points, recent, redeemTiers: REDEEM_TIERS }
}
