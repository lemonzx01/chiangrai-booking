/**
 * GET /api/user/referrals
 *
 * Returns the authenticated user's referral code, share URL,
 * funnel counts, and list of invitees (with masked emails).
 *
 * Lazy-creates the code on first request — users get one as
 * soon as they visit the profile page, no migration backfill
 * needed.
 *
 * No POST/PATCH/DELETE here: regenerating codes isn't a feature
 * yet, and admin can void referrals via the audit-loggable
 * admin endpoint (separate route, not yet built).
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireUser } from '../../../../lib/authz'
import { getReferralStats } from '../../../../lib/referral'
import { withPrivateNoStore } from '../../../../lib/cache'
import { logger } from '../../../../lib/logger'

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  try {
    const stats = await getReferralStats(auth.user.id)
    return withPrivateNoStore(NextResponse.json(stats))
  } catch (err) {
    logger.error('referrals stats failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: 'โหลดข้อมูลไม่สำเร็จ' },
      { status: 500 }
    )
  }
}
