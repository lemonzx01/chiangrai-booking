/**
 * ============================================================
 * POST /api/admin/referrals/[id]/void
 * ============================================================
 *
 * Flips a referral row to status='voided'. Used when an admin
 * spots fraud (multiple-account self-referrals, abuse, etc.).
 *
 * What this DOES:
 *   - Marks the referral row 'voided'
 *   - Writes an admin_audit_log entry with the reason metadata
 *
 * What this does NOT do:
 *   - Disable already-issued coupons. If both sides got their
 *     coupons before the void, those codes are still active.
 *     The admin can deactivate them separately via the coupon
 *     admin UI — keeping the actions distinct lets the admin
 *     void the relationship without burning a paid customer's
 *     reward, or vice versa.
 *
 * Admin auth required. Body: { reason?: string }
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../../lib/authz'
import { voidReferral } from '../../../../../../lib/referral'
import { logAdminAction } from '../../../../../../lib/audit'
import { logger } from '../../../../../../lib/logger'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: 'Missing referral id' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({})) as {
      reason?: string
    }
    const reason =
      typeof body.reason === 'string' && body.reason.trim()
        ? body.reason.trim().slice(0, 500)
        : null

    const result = await voidReferral(id)
    if (!result.ok) {
      // 404 vs 500 — if the row didn't change because it's already
      // voided or doesn't exist, we treat that as "not found" so
      // admin gets a clear signal.
      if (result.reason === 'not_found_or_already_voided') {
        return NextResponse.json(
          { error: 'ไม่พบรายการแนะนำหรือถูกยกเลิกไปแล้ว' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'ไม่สามารถยกเลิกได้' },
        { status: 500 }
      )
    }

    // Audit trail — fire-and-forget; never blocks the response.
    void logAdminAction({
      actor: auth.user,
      request,
      action: 'referral.void',
      resource_type: 'referral',
      resource_id: id,
      metadata: { reason },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('admin void-referral threw', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
