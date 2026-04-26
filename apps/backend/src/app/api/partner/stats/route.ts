/**
 * GET /api/partner/stats
 *
 * Aggregated business metrics for the logged-in partner. The
 * partner dashboard reads this on mount; we keep the calls
 * cheap (a handful of count/sum queries) and bound the time
 * window to "last N days" so query cost is predictable.
 *
 * Query params:
 *   - days: lookback window (default 30, max 365)
 *
 * Returns:
 *   {
 *     window:   { from, to, days },
 *     totals:   { revenue, bookings, cancelled, refundedAmount },
 *     occupancy: { hotelNightsBooked, hotelNightsTotal, percent },
 *     upcoming:  { count, next7Days },
 *     timeline:  [{ date, revenue, bookings }],   // last `days`
 *     topDates:  [{ date, revenue, bookings }],   // top 5 by revenue
 *     statusBreakdown: { PENDING, CONFIRMED, PAID, CANCELLED, COMPLETED }
 *   }
 *
 * Admins get the same shape but across ALL listings — useful
 * when an admin impersonates the partner view to debug.
 *
 * Currency: rolled up in THB (the canonical currency on the
 * bookings table). Multi-currency reporting would need
 * exchange-rate normalisation we'd rather defer.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/server'
import { requirePartner } from '../../../../lib/authz'
import { verifyAdminToken } from '../../../../lib/auth'
import { withPrivateNoStore } from '../../../../lib/cache'
import { logger } from '../../../../lib/logger'

interface BookingRow {
  status: string
  total_price: number | null
  refund_amount: number | null
  check_in_date: string
  check_out_date: string
  created_at: string
  hotel_id: string | null
  car_id: string | null
}

interface RoomTypeRow {
  total_rooms: number | null
  hotel_id: string
}

const ACTIVE_STATUSES = new Set([
  'PENDING',
  'CONFIRMED',
  'PAID',
  'COMPLETED',
])

export async function GET(request: Request) {
  const auth = await requirePartner()
  if (!auth.ok) return auth.response

  const adminCheck = await verifyAdminToken()
  const isAdmin = adminCheck.success === true
  const partnerId = auth.user.id

  const { searchParams } = new URL(request.url)
  const days = Math.min(
    365,
    Math.max(1, parseInt(searchParams.get('days') || '30'))
  )

  const supabase = await createAdminClient()

  try {
    // ---- 1. Resolve which listings belong to this partner.
    //         Admins skip this filter and see everything.
    let hotelIds: string[] = []
    let carIds: string[] = []

    if (!isAdmin) {
      const [hotelRes, carRes] = await Promise.all([
        supabase.from('hotels').select('id').eq('owner_id', partnerId),
        supabase.from('cars').select('id').eq('owner_id', partnerId),
      ])
      if (hotelRes.error) throw hotelRes.error
      if (carRes.error) throw carRes.error
      hotelIds = ((hotelRes.data as Array<{ id: string }>) || []).map((r) => r.id)
      carIds = ((carRes.data as Array<{ id: string }>) || []).map((r) => r.id)

      // Partner with no listings yet → return zeros so the UI
      // can show an empty-state instead of crashing.
      if (hotelIds.length === 0 && carIds.length === 0) {
        return withPrivateNoStore(NextResponse.json(emptyResponse(days)))
      }
    }

    // ---- 2. Pull bookings inside the lookback window.
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    const fromIso = fromDate.toISOString()

    let bookingQuery = supabase
      .from('bookings')
      .select(
        'status, total_price, refund_amount, check_in_date, check_out_date, created_at, hotel_id, car_id'
      )
      .gte('created_at', fromIso)
      .order('created_at', { ascending: true })
      .limit(10_000)

    if (!isAdmin) {
      const ownerFilters: string[] = []
      if (hotelIds.length > 0) {
        ownerFilters.push(`hotel_id.in.(${hotelIds.map((id) => `"${id}"`).join(',')})`)
      }
      if (carIds.length > 0) {
        ownerFilters.push(`car_id.in.(${carIds.map((id) => `"${id}"`).join(',')})`)
      }
      if (ownerFilters.length > 0) {
        bookingQuery = bookingQuery.or(ownerFilters.join(','))
      }
    }

    const { data: bookingData, error: bookingErr } = await bookingQuery
    if (bookingErr) throw bookingErr
    const bookings = (bookingData as BookingRow[] | null) || []

    // ---- 3. Pull total room capacity for occupancy denominator.
    let roomTypes: RoomTypeRow[] = []
    if (hotelIds.length > 0 || isAdmin) {
      let roomQuery = supabase
        .from('room_types')
        .select('total_rooms, hotel_id')
      if (!isAdmin && hotelIds.length > 0) {
        roomQuery = roomQuery.in('hotel_id', hotelIds)
      }
      const { data: rt, error: rtErr } = await roomQuery
      if (rtErr) {
        logger.warn('partner stats: room_types lookup failed', {
          error: rtErr,
        })
      } else {
        roomTypes = (rt as RoomTypeRow[] | null) || []
      }
    }
    const totalRooms = roomTypes.reduce(
      (sum, r) => sum + (r.total_rooms || 0),
      0
    )

    // ---- 4. Compute aggregates.
    const totals = {
      revenue: 0,
      bookings: 0,
      cancelled: 0,
      refundedAmount: 0,
    }
    const statusBreakdown: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PAID: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    }
    const timelineMap = new Map<string, { revenue: number; bookings: number }>()
    let hotelNightsBooked = 0

    for (const b of bookings) {
      totals.bookings++
      statusBreakdown[b.status] = (statusBreakdown[b.status] || 0) + 1

      if (ACTIVE_STATUSES.has(b.status)) {
        totals.revenue += Number(b.total_price || 0)
      }
      if (b.status === 'CANCELLED') {
        totals.cancelled++
        totals.refundedAmount += Number(b.refund_amount || 0)
      }

      // Timeline keyed by created_at YYYY-MM-DD
      const day = b.created_at.slice(0, 10)
      const slot = timelineMap.get(day) || { revenue: 0, bookings: 0 }
      slot.bookings++
      if (ACTIVE_STATUSES.has(b.status)) {
        slot.revenue += Number(b.total_price || 0)
      }
      timelineMap.set(day, slot)

      // Occupancy: count nights for hotel bookings that aren't cancelled
      if (b.hotel_id && b.status !== 'CANCELLED') {
        const nights = nightsBetween(b.check_in_date, b.check_out_date)
        if (nights > 0) hotelNightsBooked += nights
      }
    }

    // Sorted timeline
    const timeline = Array.from(timelineMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top 5 days by revenue
    const topDates = [...timeline]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .filter((d) => d.revenue > 0)

    // Occupancy denominator: total_rooms * window_days = available
    // room-nights in the window. Loose approximation; doesn't
    // account for partner blocks reducing supply.
    const hotelNightsTotal = totalRooms * days
    const occupancyPercent =
      hotelNightsTotal > 0
        ? Math.round((hotelNightsBooked / hotelNightsTotal) * 1000) / 10
        : 0

    // Upcoming: bookings with check_in_date in the next 7 days
    const today = new Date().toISOString().slice(0, 10)
    const sevenAhead = new Date()
    sevenAhead.setDate(sevenAhead.getDate() + 7)
    const sevenAheadIso = sevenAhead.toISOString().slice(0, 10)
    const upcomingNext7 = bookings.filter(
      (b) =>
        b.check_in_date >= today &&
        b.check_in_date <= sevenAheadIso &&
        b.status !== 'CANCELLED'
    )

    return withPrivateNoStore(
      NextResponse.json({
        window: {
          from: fromIso.slice(0, 10),
          to: today,
          days,
        },
        totals,
        occupancy: {
          hotelNightsBooked,
          hotelNightsTotal,
          percent: occupancyPercent,
        },
        upcoming: {
          count: upcomingNext7.length,
          next7Days: upcomingNext7.length,
        },
        timeline,
        topDates,
        statusBreakdown,
        is_admin: isAdmin,
      })
    )
  } catch (err) {
    logger.error('partner stats failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดสถิติได้' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  const ms = b.getTime() - a.getTime()
  if (Number.isNaN(ms)) return 0
  return Math.max(0, Math.round(ms / 86400_000))
}

function emptyResponse(days: number) {
  const today = new Date().toISOString().slice(0, 10)
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  return {
    window: { from: fromDate.toISOString().slice(0, 10), to: today, days },
    totals: { revenue: 0, bookings: 0, cancelled: 0, refundedAmount: 0 },
    occupancy: { hotelNightsBooked: 0, hotelNightsTotal: 0, percent: 0 },
    upcoming: { count: 0, next7Days: 0 },
    timeline: [],
    topDates: [],
    statusBreakdown: {
      PENDING: 0,
      CONFIRMED: 0,
      PAID: 0,
      CANCELLED: 0,
      COMPLETED: 0,
    },
    is_admin: false,
  }
}
