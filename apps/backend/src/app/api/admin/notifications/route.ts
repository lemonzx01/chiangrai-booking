/**
 * ============================================================
 * Admin Notifications API — List / mark-all-read
 * ============================================================
 *
 * GET  /api/admin/notifications?status=unread|read|all&limit&offset
 * POST /api/admin/notifications  { action: "mark_all_read" }
 *
 * Admin auth required.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { requireAdmin } from '../../../../lib/authz'
import { createAdminClient } from '../../../../lib/supabase/server'
import { apiBadRequest, apiServerError, apiSuccess } from '../../../../lib/errors'
import { logger } from '../../../../lib/logger'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '50', 10), 1),
      200
    )
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const supabase = await createAdminClient()
    let query = supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status === 'unread') query = query.eq('is_read', false)
    if (status === 'read') query = query.eq('is_read', true)

    const { data, error, count } = await query
    if (error) {
      logger.error('List notifications failed', { error: error.message })
      return apiServerError(error, 'ไม่สามารถโหลดการแจ้งเตือนได้')
    }

    // Unread badge count
    const unreadRes = await supabase
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    return apiSuccess({
      notifications: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      summary: {
        unread: unreadRes.count || 0,
      },
    })
  } catch (error) {
    return apiServerError(error)
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json().catch(() => ({}))
    const action = body?.action

    if (action !== 'mark_all_read') {
      return apiBadRequest('รองรับเฉพาะ action=mark_all_read เท่านั้น')
    }

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false)

    if (error) {
      logger.error('Mark all read failed', { error: error.message })
      return apiServerError(error, 'อัปเดตสถานะไม่สำเร็จ')
    }

    return apiSuccess({ message: 'อัปเดตการแจ้งเตือนทั้งหมดเป็น อ่านแล้ว แล้ว' })
  } catch (error) {
    return apiServerError(error)
  }
}
