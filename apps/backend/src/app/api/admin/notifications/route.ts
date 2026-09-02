/**
 * ============================================================
 * Admin Notifications API — List / bulk actions
 * ============================================================
 *
 * GET  /api/admin/notifications
 *   ?status=unread|read|all
 *   &type=booking.created|payment.refunded|...
 *   &severity=info|warning|error
 *   &limit&offset
 *
 * POST /api/admin/notifications  body:
 *   { action: "mark_all_read" }
 *   { action: "mark_read",   ids: ["uuid", ...] }
 *   { action: "mark_unread", ids: ["uuid", ...] }
 *   { action: "delete",      ids: ["uuid", ...] }
 *
 * Admin auth required.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { requireAdmin } from '../../../../lib/authz'
import { createAdminClient } from '../../../../lib/supabase/server'
import { apiBadRequest, apiServerError, apiSuccess } from '../../../../lib/errors'
import { logger } from '../../../../lib/logger'
import { verifyCsrfToken } from '../../../../lib/csrf'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') // e.g. 'booking.created'
    const severity = searchParams.get('severity') // 'info' | 'warning' | 'error'
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
    if (type) query = query.eq('type', type)
    if (severity) query = query.eq('severity', severity)

    const { data, error, count } = await query
    if (error) {
      logger.error('List notifications failed', { error: error.message })
      return apiServerError(error, 'ไม่สามารถโหลดการแจ้งเตือนได้')
    }

    // Unread badge count (always counts ALL unread, ignores filter)
    const unreadRes = await supabase
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    // Type breakdown — surface the distinct types so the UI can
    // populate a filter dropdown without a second round-trip.
    // Cap at 1000 to keep the query bounded; admin notifications
    // table is small in practice.
    const typesRes = await supabase
      .from('admin_notifications')
      .select('type')
      .order('created_at', { ascending: false })
      .limit(1000)
    const distinctTypes = Array.from(
      new Set(((typesRes.data as Array<{ type: string }> | null) || []).map((r) => r.type).filter(Boolean))
    ).sort()

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
        types: distinctTypes,
      },
    })
  } catch (error) {
    return apiServerError(error)
  }
}

// Hard cap — generous, but keeps a runaway client from sweeping
// the whole table in one request.
const MAX_BULK_IDS = 200

export async function POST(request: Request) {
  // CSRF: state-changing + authenticated, so it needs the
  // double-submit check. Safe methods are skipped inside
  // verifyCsrfToken itself.
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string
      ids?: unknown
    }
    const action = body?.action

    const supabase = await createAdminClient()
    const now = new Date().toISOString()

    // ---- Bulk: mark_all_read (no ids needed) -----------------
    if (action === 'mark_all_read') {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true, read_at: now })
        .eq('is_read', false)

      if (error) {
        logger.error('Mark all read failed', { error: error.message })
        return apiServerError(error, 'อัปเดตสถานะไม่สำเร็จ')
      }
      return apiSuccess({ message: 'อัปเดตการแจ้งเตือนทั้งหมดเป็น อ่านแล้ว' })
    }

    // ---- Targeted bulk actions: validate ids ------------------
    if (action === 'mark_read' || action === 'mark_unread' || action === 'delete') {
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return apiBadRequest('ต้องระบุ ids เป็น array อย่างน้อย 1 รายการ')
      }
      const ids = (body.ids as unknown[]).filter(
        (x): x is string => typeof x === 'string' && x.length > 0
      )
      if (ids.length === 0) {
        return apiBadRequest('ids ต้องเป็น array ของ string')
      }
      if (ids.length > MAX_BULK_IDS) {
        return apiBadRequest(`สูงสุด ${MAX_BULK_IDS} รายการต่อรอบ`)
      }

      if (action === 'delete') {
        const { error } = await supabase
          .from('admin_notifications')
          .delete()
          .in('id', ids)
        if (error) {
          logger.error('Bulk delete notifications failed', {
            error: error.message,
          })
          return apiServerError(error, 'ลบไม่สำเร็จ')
        }
        return apiSuccess({ deleted: ids.length })
      }

      // mark_read / mark_unread
      const isRead = action === 'mark_read'
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: isRead, read_at: isRead ? now : null })
        .in('id', ids)
      if (error) {
        logger.error('Bulk mark notifications failed', {
          error: error.message,
        })
        return apiServerError(error, 'อัปเดตสถานะไม่สำเร็จ')
      }
      return apiSuccess({ updated: ids.length, is_read: isRead })
    }

    return apiBadRequest(
      'action ต้องเป็น mark_all_read | mark_read | mark_unread | delete'
    )
  } catch (error) {
    return apiServerError(error)
  }
}
