/**
 * GET /api/user/loyalty
 *
 * Returns the authenticated user's current point balance + last
 * 10 ledger entries. Powers the LoyaltyCard on /profile.
 *
 * No POST/PATCH yet — points are awarded automatically by the
 * Stripe webhook when a booking flips to PAID. Manual adjustments
 * (admin-only) live on a separate admin endpoint we'll add when
 * tier rules ship.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireUser } from '../../../../lib/authz'
import { getLoyaltyOverview } from '../../../../lib/loyalty'
import { withPrivateNoStore } from '../../../../lib/cache'
import { logger } from '../../../../lib/logger'

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  try {
    const overview = await getLoyaltyOverview(auth.user.id)
    return withPrivateNoStore(NextResponse.json(overview))
  } catch (err) {
    logger.error('loyalty overview failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: 'โหลดข้อมูลไม่สำเร็จ' },
      { status: 500 }
    )
  }
}
