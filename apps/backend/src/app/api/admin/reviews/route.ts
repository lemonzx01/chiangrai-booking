/**
 * ============================================================
 * Admin Reviews API — List reviews for moderation
 * ============================================================
 *
 * GET /api/admin/reviews?status=pending|approved|all&hotel_id=...&car_id=...
 *
 * Admin auth required.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { requireAdmin } from '../../../../lib/authz'
import { createAdminClient } from '../../../../lib/supabase/server'
import { apiServerError, apiSuccess } from '../../../../lib/errors'
import { logger } from '../../../../lib/logger'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const hotelId = searchParams.get('hotel_id')
    const carId = searchParams.get('car_id')
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '50', 10), 1),
      200
    )
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const supabase = await createAdminClient()
    let query = supabase
      .from('reviews')
      .select('*, hotel:hotels(id,name_th,name_en), car:cars(id,name_th,name_en)', {
        count: 'exact',
      })
      .range(offset, offset + limit - 1)

    // Pending: sort by spam_score DESC so the obvious-junk reviews
    // are at the top (admin can swat them fast). Approved: keep
    // newest-first since spam_score is irrelevant once approved.
    if (status === 'pending') {
      query = query
        .order('spam_score', { ascending: false })
        .order('created_at', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (status === 'pending') query = query.eq('is_approved', false)
    if (status === 'approved') query = query.eq('is_approved', true)
    if (hotelId) query = query.eq('hotel_id', hotelId)
    if (carId) query = query.eq('car_id', carId)

    const { data, error, count } = await query
    if (error) {
      logger.error('List reviews failed', { error: error.message })
      return apiServerError(error, 'ไม่สามารถโหลดรายการรีวิวได้')
    }

    // Counts for summary cards
    const [pendingRes, approvedRes] = await Promise.all([
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', false),
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true),
    ])

    return apiSuccess({
      reviews: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      summary: {
        pending: pendingRes.count || 0,
        approved: approvedRes.count || 0,
      },
    })
  } catch (error) {
    return apiServerError(error)
  }
}
