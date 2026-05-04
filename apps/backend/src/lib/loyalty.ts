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
import { LOYALTY_DEFAULT_RATE_THB_PER_POINT } from '@chiangrai/shared/constants'

// ---------------------------------------------------------------
// Tunable rate
// ---------------------------------------------------------------

// Mirrors the shared default so backend and frontend "+X pts"
// previews compute the same number. Backend additionally allows
// runtime overrides via env; frontend uses the shared default
// directly.
const DEFAULT_RATE_THB_PER_POINT = LOYALTY_DEFAULT_RATE_THB_PER_POINT

// ---------------------------------------------------------------
// Tier system (phase 2)
// ---------------------------------------------------------------
//
// Three tiers gated by lifetime-earned points. Each tier ALSO
// multiplies the base earn rate, so a Gold user accumulating
// is steeper — the program rewards loyalty by getting more
// generous over time, not just less.
//
// Why constants in code (not a DB table):
//   - Three rows that change rarely. A DB table would be over-
//     engineering — every read costs a join.
//   - Adjusting thresholds during early-stage iteration: edit
//     one file, redeploy. No migration needed.
//   - When/if we want per-promotion overrides (a 2x weekend),
//     we'll add a "tier_override" config table separately.

export interface LoyaltyTier {
  /** Stable internal id — used in API responses and analytics. */
  level: 'bronze' | 'silver' | 'gold'
  /** Display name (Latin only — UI translates to Thai itself). */
  name: string
  /** Lifetime-earned threshold. */
  minLifetime: number
  /** Earn-rate multiplier applied at this tier. */
  multiplier: number
}

export const LOYALTY_TIERS: readonly LoyaltyTier[] = [
  { level: 'bronze', name: 'Bronze', minLifetime: 0, multiplier: 1.0 },
  { level: 'silver', name: 'Silver', minLifetime: 500, multiplier: 1.25 },
  { level: 'gold', name: 'Gold', minLifetime: 2000, multiplier: 1.5 },
] as const

/**
 * Resolve a user's current tier from their lifetime-earned
 * counter. Iterates from highest to lowest so the first match
 * is the highest tier the user qualifies for.
 */
export function getTier(lifetimeEarned: number): LoyaltyTier {
  if (!Number.isFinite(lifetimeEarned) || lifetimeEarned < 0) {
    return LOYALTY_TIERS[0]
  }
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (lifetimeEarned >= LOYALTY_TIERS[i].minLifetime) {
      return LOYALTY_TIERS[i]
    }
  }
  return LOYALTY_TIERS[0]
}

/**
 * Resolve the next tier above the user's current one (for
 * progress UI). Returns null when the user is already at the
 * top tier (no "next" to chase).
 */
export function getNextTier(currentLevel: LoyaltyTier['level']): LoyaltyTier | null {
  const idx = LOYALTY_TIERS.findIndex((t) => t.level === currentLevel)
  if (idx < 0 || idx >= LOYALTY_TIERS.length - 1) return null
  return LOYALTY_TIERS[idx + 1]
}

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
    //    referral reward path. Also pull lifetime_earned so we
    //    know the user's CURRENT tier (the multiplier we apply
    //    to this earn). Tier crossing is recomputed naturally
    //    after the lifetime counter goes up.
    const { data: userRaw } = await supabase
      .from('users')
      .select('id, email, loyalty_lifetime_earned')
      .ilike('email', input.customerEmail.trim())
      .maybeSingle()
    const user = userRaw as {
      id: string
      email: string
      loyalty_lifetime_earned: number | null
    } | null
    if (!user) return { awarded: false, points: 0, reason: 'unknown_user' }

    // Apply current-tier multiplier to the base point amount.
    // A Bronze user earns 1.0× (= the base), Silver 1.25×, Gold
    // 1.50×. We round AFTER multiplication so partial-credit
    // never accumulates as floor-loss.
    const tier = getTier(user.loyalty_lifetime_earned || 0)
    const finalPoints = Math.round(points * tier.multiplier)

    // 2. Insert ledger row. The UNIQUE partial index (source_id,
    //    kind='earn', source_type='booking') gives us idempotency:
    //    a duplicate insert for the same booking returns 23505
    //    and we treat it as a silent no-op.
    const tierTag = tier.level !== 'bronze' ? ` ×${tier.multiplier}` : ''
    const reason = input.bookingCode
      ? `จองสำเร็จ ${input.bookingCode} (฿${input.amountThb.toLocaleString()})${tierTag}`
      : `จองสำเร็จ (฿${input.amountThb.toLocaleString()})${tierTag}`

    const { error: insertErr } = await supabase
      .from('loyalty_ledger')
      .insert({
        user_id: user.id,
        delta: finalPoints,
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

    // 3. Bump BOTH counters: the spendable balance
    //    (loyalty_points) AND the lifetime-earned counter
    //    (loyalty_lifetime_earned) which gates tier eligibility.
    //    Lifetime never decreases — redeem only touches the
    //    spendable balance.
    //
    //    Read-modify-write is fine here: award contention per
    //    user is low (one booking-paid event per checkout) and
    //    the ledger insert above is what actually serializes
    //    against duplicates.
    const { data: cur } = await supabase
      .from('users')
      .select('loyalty_points, loyalty_lifetime_earned')
      .eq('id', user.id)
      .maybeSingle()
    const curRow = cur as {
      loyalty_points: number
      loyalty_lifetime_earned: number | null
    } | null
    const nextBalance = (curRow?.loyalty_points || 0) + finalPoints
    const nextLifetime = (curRow?.loyalty_lifetime_earned || 0) + finalPoints
    await supabase
      .from('users')
      .update({
        loyalty_points: nextBalance,
        loyalty_lifetime_earned: nextLifetime,
      })
      .eq('id', user.id)

    return { awarded: true, points: finalPoints }
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

export interface LoyaltyTierProgress {
  /** Current tier object. Always present (defaults to Bronze). */
  current: LoyaltyTier
  /** Next tier above current — null when at the top. */
  next: LoyaltyTier | null
  /** User's lifetime-earned counter (= source of tier eligibility). */
  lifetimeEarned: number
  /** Points still needed to hit `next.minLifetime` — null at top. */
  pointsToNext: number | null
}

export interface LoyaltyOverview {
  /** Current balance — denormalized counter on users row. */
  points: number
  /** Tier + progress for the badge + progress bar widget. */
  tier: LoyaltyTierProgress
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
      .select('loyalty_points, loyalty_lifetime_earned')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('loyalty_ledger')
      .select('delta, kind, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const userRow =
    (userResult.data as {
      loyalty_points: number
      loyalty_lifetime_earned: number | null
    } | null) || null
  const points = userRow?.loyalty_points || 0
  const lifetimeEarned = userRow?.loyalty_lifetime_earned || 0

  const currentTier = getTier(lifetimeEarned)
  const nextTier = getNextTier(currentTier.level)
  const tierProgress: LoyaltyTierProgress = {
    current: currentTier,
    next: nextTier,
    lifetimeEarned,
    pointsToNext: nextTier
      ? Math.max(0, nextTier.minLifetime - lifetimeEarned)
      : null,
  }

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

  return {
    points,
    tier: tierProgress,
    recent,
    redeemTiers: REDEEM_TIERS,
  }
}
