/**
 * ============================================================
 * Admin Notification Item API
 * ============================================================
 *
 * PATCH  /api/admin/notifications/[id]   { action: "read" | "unread" }
 * DELETE /api/admin/notifications/[id]
 *
 * Admin auth required.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { requireAdmin } from '../../../../../lib/authz'
import { createAdminClient } from '../../../../../lib/supabase/server'
import {
  apiBadRequest,
  apiNotFound,
  apiServerError,
  apiSuccess,
} from '../../../../../lib/errors'
import { logger } from '../../../../../lib/logger'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const action = body?.action

    if (action !== 'read' && action !== 'unread') {
      return apiBadRequest('action ต้องเป็น "read" หรือ "unread"')
    }

    const supabase = await createAdminClient()
    const update =
      action === 'read'
        ? { is_read: true, read_at: new Date().toISOString() }
        : { is_read: false, read_at: null }

    const { data, error } = await supabase
      .from('admin_notifications')
      .update(update)
      .eq('id', id)
      .select('*')

    if (error) {
      logger.error('Update notification failed', { id, error: error.message })
      return apiServerError(error, 'อัปเดตการแจ้งเตือนไม่สำเร็จ')
    }
    if (!data || data.length === 0) {
      return apiNotFound('ไม่พบการแจ้งเตือน')
    }

    return apiSuccess({ notification: data[0] })
  } catch (error) {
    return apiServerError(error)
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const supabase = await createAdminClient()
    // Mock client does not support .delete({count:'exact'}), so select the id back.
    const { data, error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) {
      logger.error('Delete notification failed', { id, error: error.message })
      return apiServerError(error, 'ลบการแจ้งเตือนไม่สำเร็จ')
    }
    if (!data || data.length === 0) {
      return apiNotFound('ไม่พบการแจ้งเตือน')
    }

    return apiSuccess({ message: 'ลบการแจ้งเตือนแล้ว' })
  } catch (error) {
    return apiServerError(error)
  }
}
