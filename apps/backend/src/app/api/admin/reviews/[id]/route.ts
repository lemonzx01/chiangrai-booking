/**
 * ============================================================
 * Admin Reviews API — Approve / Reject / Delete
 * ============================================================
 *
 * PATCH  /api/admin/reviews/[id]
 *   body: { action: 'approve' | 'reject', rejection_reason?: string }
 * DELETE /api/admin/reviews/[id]
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
import { verifyCsrfToken } from '../../../../../lib/csrf'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Params) {
  // CSRF: state-changing + authenticated, so it needs the
  // double-submit check. Safe methods are skipped inside
  // verifyCsrfToken itself.
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json().catch(() => null)
    const action = body?.action as 'approve' | 'reject' | undefined
    if (action !== 'approve' && action !== 'reject') {
      return apiBadRequest('action must be "approve" or "reject"')
    }

    const rejectionReason =
      typeof body?.rejection_reason === 'string' ? body.rejection_reason.trim() : null

    const updates: Record<string, unknown> = {
      is_approved: action === 'approve',
      moderated_at: new Date().toISOString(),
      moderated_by: (auth.user as any)?.email || (auth.user as any)?.id || 'admin',
      rejection_reason: action === 'reject' ? rejectionReason : null,
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return apiNotFound('ไม่พบรีวิวนี้')
      }
      logger.error('Moderate review failed', { id, error: error.message })
      return apiServerError(error, 'ไม่สามารถอัปเดตรีวิวได้')
    }

    return apiSuccess({ review: data })
  } catch (error) {
    return apiServerError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  // CSRF: state-changing + authenticated, so it needs the
  // double-submit check. Safe methods are skipped inside
  // verifyCsrfToken itself.
  const csrfFail = await verifyCsrfToken(_request)
  if (csrfFail) return csrfFail

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) {
      logger.error('Delete review failed', { id, error: error.message })
      return apiServerError(error, 'ไม่สามารถลบรีวิวได้')
    }
    if (!Array.isArray(data) || data.length === 0) {
      return apiNotFound('ไม่พบรีวิวนี้')
    }

    return apiSuccess({ deleted: true, id })
  } catch (error) {
    return apiServerError(error)
  }
}
