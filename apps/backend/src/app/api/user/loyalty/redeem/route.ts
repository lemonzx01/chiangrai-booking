/**
 * POST /api/user/loyalty/redeem
 *
 * Trade points for a one-shot, email-bound coupon. Body:
 *   { points: number }   // must match a REDEEM_TIERS entry
 *
 * Response (success):
 *   { ok: true, couponCode, pointsRemaining, valueThb, expiresAt }
 *
 * Response (failure):
 *   400 invalid_tier         — points doesn't match any tier
 *   402 insufficient_points  — balance below cost
 *   409 race_lost            — concurrent redemption beat us
 *   500 db_error / coupon_insert_failed
 *
 * Why a separate route under /api/user/loyalty rather than a
 * verb on the overview endpoint:
 *   GET stays cacheable (no-store but conceptually idempotent),
 *   POST gets the rate-limit wrapping. Two routes = two clear
 *   responsibilities.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireUser } from '../../../../../lib/authz'
import { redeemPointsForCoupon } from '../../../../../lib/loyalty'
import { logger } from '../../../../../lib/logger'
import { rateLimitAsync } from '../../../../../middleware/rate-limit'
import { verifyCsrfToken } from '../../../../../lib/csrf'

export async function POST(request: Request) {
  // Rate limit BEFORE auth — keeps an unauthenticated attacker
  // from probing the endpoint by spamming bad cookies. The cap
  // is per-IP (see RATE_LIMIT_CONFIG) so a real user with a
  // stable address gets a generous quota; bots scaled across
  // a few IPs still hit it quickly.
  const limitResponse = await rateLimitAsync(request, '/api/user/loyalty/redeem')
  if (limitResponse) return limitResponse

  // CSRF: state-changing + authenticated, so it needs the
  // double-submit check. Safe methods are skipped inside
  // verifyCsrfToken itself.
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireUser()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json().catch(() => ({})) as { points?: unknown }
    const points = Number(body.points)

    if (!Number.isFinite(points) || points <= 0) {
      return NextResponse.json(
        { error: 'จำนวนแต้มไม่ถูกต้อง', reason: 'invalid_tier' },
        { status: 400 }
      )
    }

    const result = await redeemPointsForCoupon({
      userId: auth.user.id,
      points,
    })

    if (!result.ok) {
      // Map internal reason codes → HTTP status. Keep the
      // body's `reason` field stable so the UI can branch.
      const status =
        result.reason === 'invalid_tier'
          ? 400
          : result.reason === 'insufficient_points'
            ? 402
            : result.reason === 'race_lost'
              ? 409
              : result.reason === 'unknown_user'
                ? 401
                : 500

      const message =
        result.reason === 'invalid_tier'
          ? 'จำนวนแต้มไม่ตรงกับตัวเลือกที่มี'
          : result.reason === 'insufficient_points'
            ? 'แต้มไม่พอสำหรับการแลก'
            : result.reason === 'race_lost'
              ? 'มีการแลกแต้มพร้อมกัน กรุณาลองใหม่'
              : 'ไม่สามารถแลกแต้มได้'

      return NextResponse.json(
        { error: message, reason: result.reason },
        { status }
      )
    }

    return NextResponse.json({
      ok: true,
      couponCode: result.couponCode,
      pointsRemaining: result.pointsRemaining,
      valueThb: result.valueThb,
      expiresAt: result.expiresAt,
    })
  } catch (err) {
    logger.error('loyalty redeem handler threw', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด', reason: 'db_error' },
      { status: 500 }
    )
  }
}
