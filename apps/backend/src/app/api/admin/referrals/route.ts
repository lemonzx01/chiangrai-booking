/**
 * ============================================================
 * Admin Referrals API — list with filters
 * ============================================================
 *
 * GET /api/admin/referrals?status=pending|qualified|rewarded|voided
 *
 * Returns recent referrals with both sides' names/emails for the
 * admin UI. Defaults to all statuses, newest-first, capped at 100.
 *
 * Admin auth required.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/authz'
import { createAdminClient } from '../../../../lib/supabase/server'
import { withPrivateNoStore } from '../../../../lib/cache'
import { logger } from '../../../../lib/logger'

const ALLOWED_STATUSES = new Set([
  'pending',
  'qualified',
  'rewarded',
  'voided',
])
const MAX_LIMIT = 100

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const url = new URL(request.url)
    const statusParam = url.searchParams.get('status')
    const status =
      statusParam && ALLOWED_STATUSES.has(statusParam) ? statusParam : null

    const supabase = await createAdminClient()

    let query = supabase
      .from('referrals')
      .select(
        `id, status, referral_code, qualified_at, rewarded_at,
         referrer_coupon_code, referee_coupon_code, created_at,
         referrer:users!referrals_referrer_id_fkey(id, name, email),
         referee:users!referrals_referee_id_fkey(id, name, email)`
      )
      .order('created_at', { ascending: false })
      .limit(MAX_LIMIT)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
      logger.error('admin referrals list failed', { error: error.message })
      return NextResponse.json(
        { error: 'ไม่สามารถโหลดข้อมูลได้' },
        { status: 500 }
      )
    }

    return withPrivateNoStore(NextResponse.json({ referrals: data || [] }))
  } catch (err) {
    logger.error('admin referrals threw', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
