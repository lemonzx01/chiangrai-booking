/**
 * GET /api/partner/bookings/export
 *
 * CSV export of bookings the authenticated partner owns.
 * Mirrors the admin variant at /api/admin/bookings/export
 * but scoped to listings the partner owns.
 *
 * Why a partner-side export at all:
 *   Partners own the relationship with their guests at
 *   check-in. Knowing who's coming, when, and how to reach
 *   them — without logging into a dashboard tab — saves
 *   real time. CSV is the lowest-common-denominator format
 *   that opens in Excel, Numbers, Google Sheets, and any
 *   accounting tool the partner already uses.
 *
 * Query params:
 *   - status: filter by booking status
 *   - from / to: ISO date range over `created_at`
 *   - limit: max 5000 (partners shouldn't need 50k like admins)
 *
 * Privacy:
 *   - Customer email + phone ARE included — partners genuinely
 *     need them to coordinate check-in. RLS at the table level
 *     would block this so we use service-role + explicit owner
 *     filtering here.
 *   - Audit: every export logs an admin_audit_log row tagged
 *     by the partner's id, mirroring the admin export pattern.
 */

export const dynamic = 'force-dynamic'

import { createAdminClient } from '../../../../../lib/supabase/server'
import { requirePartner } from '../../../../../lib/authz'
import { verifyAdminToken } from '../../../../../lib/auth'
import { rowsToCsv, csvAttachmentHeaders } from '../../../../../lib/csv'
import { logAdminAction } from '../../../../../lib/audit'
import { logger } from '../../../../../lib/logger'

const MAX_LIMIT = 5000

interface BookingRow {
  booking_code: string
  status: string
  booking_type: string
  customer_name: string
  customer_email: string
  customer_phone: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  total_price: number
  currency: string
  refund_amount: number | null
  refund_status: string | null
  created_at: string
  hotel_id: string | null
  car_id: string | null
  hotel: { name_th: string | null } | { name_th: string | null }[] | null
  car: { name_th: string | null } | { name_th: string | null }[] | null
}

export async function GET(request: Request) {
  const auth = await requirePartner()
  if (!auth.ok) return auth.response

  const adminCheck = await verifyAdminToken()
  const isAdmin = adminCheck.success === true
  const partnerId = auth.user.id

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') || '5000'))
  )

  const supabase = await createAdminClient()

  // Resolve which listings belong to this partner so we can
  // filter the bookings query. Admins skip this filter (so an
  // admin-impersonating-partner view returns the full set).
  let hotelIds: string[] = []
  let carIds: string[] = []
  if (!isAdmin) {
    const [hotelRes, carRes] = await Promise.all([
      supabase.from('hotels').select('id').eq('owner_id', partnerId),
      supabase.from('cars').select('id').eq('owner_id', partnerId),
    ])
    if (hotelRes.error || carRes.error) {
      logger.error('partner export: ownership lookup failed', {
        hotelErr: hotelRes.error?.message,
        carErr: carRes.error?.message,
      })
      return new Response(JSON.stringify({ error: 'Export failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    hotelIds = ((hotelRes.data as Array<{ id: string }>) || []).map((r) => r.id)
    carIds = ((carRes.data as Array<{ id: string }>) || []).map((r) => r.id)

    // Partner with no listings — return an empty CSV with just
    // the header row so the file is still well-formed.
    if (hotelIds.length === 0 && carIds.length === 0) {
      return emptyCsv()
    }
  }

  let query = supabase
    .from('bookings')
    .select(
      `booking_code, status, booking_type, customer_name, customer_email,
       customer_phone, check_in_date, check_out_date, number_of_guests,
       total_price, currency, refund_amount, refund_status, created_at,
       hotel_id, car_id,
       hotel:hotels(name_th), car:cars(name_th)`
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!isAdmin) {
    const ownerFilters: string[] = []
    if (hotelIds.length > 0) {
      ownerFilters.push(`hotel_id.in.(${hotelIds.map((id) => `"${id}"`).join(',')})`)
    }
    if (carIds.length > 0) {
      ownerFilters.push(`car_id.in.(${carIds.map((id) => `"${id}"`).join(',')})`)
    }
    if (ownerFilters.length > 0) {
      query = query.or(ownerFilters.join(','))
    }
  }

  if (status) query = query.eq('status', status)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query
  if (error) {
    logger.error('partner export query failed', { error: error.message })
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rows = (data as BookingRow[] | null) || []
  const headers = [
    'booking_code',
    'status',
    'booking_type',
    'item',
    'customer_name',
    'customer_email',
    'customer_phone',
    'check_in_date',
    'check_out_date',
    'number_of_guests',
    'total_price',
    'currency',
    'refund_amount',
    'refund_status',
    'created_at',
  ]
  const flat = rows.map((r) => {
    const hotel = Array.isArray(r.hotel) ? r.hotel[0] : r.hotel
    const car = Array.isArray(r.car) ? r.car[0] : r.car
    return {
      booking_code: r.booking_code,
      status: r.status,
      booking_type: r.booking_type,
      item: hotel?.name_th || car?.name_th || '',
      customer_name: r.customer_name,
      customer_email: r.customer_email,
      customer_phone: r.customer_phone,
      check_in_date: r.check_in_date,
      check_out_date: r.check_out_date,
      number_of_guests: r.number_of_guests,
      total_price: r.total_price,
      currency: r.currency,
      refund_amount: r.refund_amount ?? '',
      refund_status: r.refund_status ?? '',
      created_at: r.created_at,
    }
  })

  const csv = rowsToCsv(headers, flat)
  const filename = `partner-bookings_${todayStamp()}.csv`

  // Audit row — partner exports get the same paper trail as
  // admin exports. The actor is the partner, but the audit
  // table is shared so admins can review.
  logAdminAction({
    actor: { id: partnerId, email: auth.user.email },
    request,
    action: 'partner.bookings_export',
    resource_type: 'partner',
    resource_id: partnerId,
    metadata: {
      row_count: flat.length,
      hotel_ids: hotelIds.length,
      car_ids: carIds.length,
      status,
      from,
      to,
      limit,
      via_admin_impersonation: isAdmin,
    },
  })

  return new Response(csv, { headers: csvAttachmentHeaders(filename) })
}

function emptyCsv(): Response {
  const csv = rowsToCsv(
    [
      'booking_code',
      'status',
      'booking_type',
      'item',
      'customer_name',
      'customer_email',
      'customer_phone',
      'check_in_date',
      'check_out_date',
      'number_of_guests',
      'total_price',
      'currency',
      'refund_amount',
      'refund_status',
      'created_at',
    ],
    []
  )
  return new Response(csv, {
    headers: csvAttachmentHeaders(`partner-bookings_${todayStamp()}_empty.csv`),
  })
}

function todayStamp(): string {
  const d = new Date()
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
