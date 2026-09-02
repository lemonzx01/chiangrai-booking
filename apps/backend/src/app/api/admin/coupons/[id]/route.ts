/**
 * ============================================================
 * Admin Coupons API — GET / PATCH / DELETE by id
 * ============================================================
 *
 * GET    /api/admin/coupons/[id]   — fetch single coupon
 * PATCH  /api/admin/coupons/[id]   — update coupon fields
 * DELETE /api/admin/coupons/[id]   — delete coupon
 *
 * Admin auth required.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { requireAdmin } from '../../../../../lib/authz'
import { createAdminClient } from '../../../../../lib/supabase/server'
import { couponUpdateSchema } from '../../../../../lib/validations'
import {
  apiBadRequest,
  apiConflict,
  apiNotFound,
  apiServerError,
  apiSuccess,
} from '../../../../../lib/errors'
import { logger } from '../../../../../lib/logger'
import { normalizeCouponCode } from '../../../../../lib/coupons'
import { verifyCsrfToken } from '../../../../../lib/csrf'

interface Params {
  params: Promise<{ id: string }>
}

// ============================================================
// GET — single coupon
// ============================================================
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      logger.error('Fetch coupon failed', { id, error: error.message })
      return apiServerError(error)
    }
    if (!data) return apiNotFound('ไม่พบคูปองนี้')

    return apiSuccess({ coupon: data })
  } catch (error) {
    return apiServerError(error)
  }
}

// ============================================================
// PATCH — update coupon
// ============================================================
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
    if (!body || typeof body !== 'object') {
      return apiBadRequest('Invalid JSON body')
    }

    const parsed = couponUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(
        'ข้อมูลไม่ถูกต้อง',
        parsed.error.flatten().fieldErrors
      )
    }

    const updates: Record<string, unknown> = { ...parsed.data }
    if (typeof updates.code === 'string') {
      updates.code = normalizeCouponCode(updates.code)
    }

    if (Object.keys(updates).length === 0) {
      return apiBadRequest('ไม่มีข้อมูลที่จะอัปเดต')
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      if ((error as any).code === '23505') {
        return apiConflict('โค้ดคูปองนี้มีอยู่แล้ว')
      }
      if ((error as any).code === 'PGRST116') {
        return apiNotFound('ไม่พบคูปองนี้')
      }
      logger.error('Update coupon failed', { id, error: error.message })
      return apiServerError(error, 'ไม่สามารถอัปเดตคูปองได้')
    }

    return apiSuccess({ coupon: data })
  } catch (error) {
    return apiServerError(error)
  }
}

// ============================================================
// DELETE — delete coupon
// ============================================================
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
      .from('coupons')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) {
      logger.error('Delete coupon failed', { id, error: error.message })
      return apiServerError(error, 'ไม่สามารถลบคูปองได้')
    }
    if (!Array.isArray(data) || data.length === 0) {
      return apiNotFound('ไม่พบคูปองนี้')
    }

    return apiSuccess({ deleted: true, id })
  } catch (error) {
    return apiServerError(error)
  }
}
