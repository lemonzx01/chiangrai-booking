/**
 * ============================================================
 * Admin Coupons API — List & Create
 * ============================================================
 *
 * GET  /api/admin/coupons          — list coupons with pagination
 * POST /api/admin/coupons          — create a new coupon
 *
 * Admin auth required.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/authz'
import { createAdminClient } from '../../../../lib/supabase/server'
import { couponCreateSchema } from '../../../../lib/validations'
import {
  apiBadRequest,
  apiConflict,
  apiServerError,
  apiSuccess,
} from '../../../../lib/errors'
import { logger } from '../../../../lib/logger'
import { normalizeCouponCode } from '../../../../lib/coupons'
import { verifyCsrfToken } from '../../../../lib/csrf'

// ============================================================
// GET — list coupons
// ============================================================
export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)
    const active = searchParams.get('active')
    const q = searchParams.get('q')?.trim() || ''

    const supabase = await createAdminClient()
    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (active === 'true') query = query.eq('is_active', true)
    if (active === 'false') query = query.eq('is_active', false)
    if (q) query = query.ilike('code', `%${q}%`)

    const { data, error, count } = await query
    if (error) {
      logger.error('List coupons failed', { error: error.message })
      return apiServerError(error, 'ไม่สามารถโหลดรายการคูปองได้')
    }

    return apiSuccess({
      coupons: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    return apiServerError(error)
  }
}

// ============================================================
// POST — create coupon
// ============================================================
export async function POST(request: Request) {
  // CSRF: state-changing + authenticated, so it needs the
  // double-submit check. Safe methods are skipped inside
  // verifyCsrfToken itself.
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return apiBadRequest('Invalid JSON body')
    }

    const parsed = couponCreateSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(
        'ข้อมูลไม่ถูกต้อง',
        parsed.error.flatten().fieldErrors
      )
    }

    const input = parsed.data
    const supabase = await createAdminClient()

    const payload = {
      code: normalizeCouponCode(input.code),
      description: input.description ?? null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      min_spend: input.min_spend,
      max_discount: input.max_discount ?? null,
      applies_to: input.applies_to,
      starts_at: input.starts_at ?? null,
      expires_at: input.expires_at ?? null,
      is_active: input.is_active,
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      // PG unique violation
      if ((error as any).code === '23505') {
        return apiConflict('โค้ดคูปองนี้มีอยู่แล้ว')
      }
      logger.error('Create coupon failed', { error: error.message })
      return apiServerError(error, 'ไม่สามารถสร้างคูปองได้')
    }

    return NextResponse.json({ coupon: data }, { status: 201 })
  } catch (error) {
    return apiServerError(error)
  }
}
