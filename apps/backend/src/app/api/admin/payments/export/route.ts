/**
 * GET /api/admin/payments/export
 *
 * CSV export of payment records — for monthly accounting and
 * Stripe reconciliation. Joins to bookings so the row carries
 * the booking_code customers asked about.
 *
 * Optional query params:
 *   - status: PENDING | SUCCEEDED | FAILED | REFUNDED
 *   - from / to: ISO date range over `paid_at` (or
 *     `created_at` if `paid_at` is null)
 *   - limit: max 50000
 */

export const dynamic = 'force-dynamic'

import { createAdminClient } from '../../../../../lib/supabase/server'
import { requireAdmin } from '../../../../../lib/authz'
import { rowsToCsv, csvAttachmentHeaders } from '../../../../../lib/csv'
import { logAdminAction } from '../../../../../lib/audit'
import { logger } from '../../../../../lib/logger'

const MAX_LIMIT = 50000

interface PaymentRow {
  id: string
  amount: number
  currency: string
  status: string
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  stripe_refund_id: string | null
  refund_amount: number | null
  refunded_at: string | null
  paid_at: string | null
  created_at: string
  booking:
    | { booking_code: string | null; customer_email: string | null; customer_name: string | null }
    | { booking_code: string | null; customer_email: string | null; customer_name: string | null }[]
    | null
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
    .from('payments')
    .select(
      `id, amount, currency, status, stripe_payment_intent_id,
       stripe_checkout_session_id, stripe_refund_id, refund_amount,
       refunded_at, paid_at, created_at,
       booking:bookings(booking_code, customer_email, customer_name)`
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query
  if (error) {
    logger.error('payments export query failed', { error: error.message })
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rows = (data as PaymentRow[] | null) || []
  const headers = [
    'payment_id',
    'booking_code',
    'customer_name',
    'customer_email',
    'amount',
    'currency',
    'status',
    'refund_amount',
    'stripe_payment_intent_id',
    'stripe_checkout_session_id',
    'stripe_refund_id',
    'paid_at',
    'refunded_at',
    'created_at',
  ]
  const flat = rows.map((r) => {
    const b = Array.isArray(r.booking) ? r.booking[0] : r.booking
    return {
      payment_id: r.id,
      booking_code: b?.booking_code || '',
      customer_name: b?.customer_name || '',
      customer_email: b?.customer_email || '',
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      refund_amount: r.refund_amount ?? '',
      stripe_payment_intent_id: r.stripe_payment_intent_id || '',
      stripe_checkout_session_id: r.stripe_checkout_session_id || '',
      stripe_refund_id: r.stripe_refund_id || '',
      paid_at: r.paid_at || '',
      refunded_at: r.refunded_at || '',
      created_at: r.created_at,
    }
  })

  const csv = rowsToCsv(headers, flat)
  const filename = `payments_${todayStamp()}.csv`

  logAdminAction({
    actor: auth.user,
    request,
    action: 'payment.export',
    resource_type: 'payment',
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
