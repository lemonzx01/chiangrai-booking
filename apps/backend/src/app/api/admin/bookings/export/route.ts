/**
 * GET /api/admin/bookings/export
 *
 * Streams a CSV download of bookings for admin reconciliation.
 * Optional query params:
 *   - status:     filter by booking status
 *   - from:       ISO date — bookings created on or after
 *   - to:         ISO date — bookings created on or before
 *   - limit:      cap row count (default 5000, max 50000)
 *
 * Why a separate endpoint instead of "give me JSON, format
 * client-side": for any non-trivial result set, building the
 * file server-side avoids loading thousands of rows into the
 * browser, which would make Chrome stutter and fail on slow
 * machines.
 */

export const dynamic = 'force-dynamic'

import { createAdminClient } from '../../../../../lib/supabase/server'
import { requireAdmin } from '../../../../../lib/authz'
import { rowsToCsv, csvAttachmentHeaders } from '../../../../../lib/csv'
import { logAdminAction } from '../../../../../lib/audit'
import { logger } from '../../../../../lib/logger'

const MAX_LIMIT = 50000

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
  cancelled_by: string | null
  cancellation_reason: string | null
  created_at: string
  hotel: { name_th: string | null } | { name_th: string | null }[] | null
  car: { name_th: string | null } | { name_th: string | null }[] | null
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') || '5000'))
  )

  const supabase = await createAdminClient()
  let query = supabase
    .from('bookings')
    .select(
      `booking_code, status, booking_type, customer_name, customer_email,
       customer_phone, check_in_date, check_out_date, number_of_guests,
       total_price, currency, refund_amount, refund_status, cancelled_by,
       cancellation_reason, created_at,
       hotel:hotels(name_th), car:cars(name_th)`
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query
  if (error) {
    logger.error('bookings export query failed', { error: error.message })
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
    'cancelled_by',
    'cancellation_reason',
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
      cancelled_by: r.cancelled_by ?? '',
      cancellation_reason: r.cancellation_reason ?? '',
      created_at: r.created_at,
    }
  })

  const csv = rowsToCsv(headers, flat)
  const filename = `bookings_${todayStamp()}.csv`

  // Audit: bulk exports are a privacy-sensitive action; we want
  // to know who pulled customer contact info and when.
  logAdminAction({
    actor: auth.user,
    request,
    action: 'booking.export',
    resource_type: 'booking',
    resource_id: null,
    metadata: { row_count: flat.length, status, from, to, limit },
  })

  return new Response(csv, { headers: csvAttachmentHeaders(filename) })
}

function todayStamp(): string {
  const d = new Date()
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
