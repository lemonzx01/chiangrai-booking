/**
 * POST /api/admin/bookings/[code]/refund
 *
 * Admin-triggered manual refund for any amount up to the paid total.
 * Differs from /api/bookings/[code]/cancel in two ways:
 *   - Does NOT mark the booking as CANCELLED — an admin may want to
 *     issue a goodwill partial refund without voiding the booking.
 *   - Accepts an explicit `amount` and `reason`, instead of deriving
 *     a refund percentage from check-in proximity.
 *
 * Body:
 *   {
 *     "amount": number (THB),   // required, > 0, <= (payment.amount - already_refunded)
 *     "reason": string,         // required, shown in admin notifications
 *     "cancel_booking": boolean // optional, default false
 *   }
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../../lib/supabase/server'
import { requireAdmin } from '../../../../../../lib/authz'
import { verifyCsrfToken } from '../../../../../../lib/csrf'
import { processStripeRefund } from '../../../../../../lib/refund'
import { createAdminNotification } from '../../../../../../services/notifications/admin-inbox'
import { logger } from '../../../../../../lib/logger'

interface Params {
  params: Promise<{ code: string }>
}

export async function POST(request: Request, { params }: Params) {
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { code } = await params
  const body = await request.json().catch(() => null)

  const rawAmount = Number(body?.amount)
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  const cancelBooking = body?.cancel_booking === true

  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    return NextResponse.json({ error: 'amount ต้องมากกว่า 0' }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json({ error: 'กรุณาระบุเหตุผลการคืนเงิน' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Load booking + payment.
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*, payment:payments(*)')
    .eq('booking_code', code)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 })
  }

  const payment = Array.isArray((booking as { payment: unknown }).payment)
    ? ((booking as { payment: Array<Record<string, unknown>> }).payment[0] as Record<string, unknown> | undefined)
    : ((booking as { payment: Record<string, unknown> | null }).payment || undefined)

  if (!payment || payment.status !== 'SUCCEEDED') {
    return NextResponse.json(
      { error: 'ไม่พบรายการชำระเงินที่สำเร็จ จึงไม่สามารถคืนเงินได้' },
      { status: 400 }
    )
  }

  const paymentAmount = Number(payment.amount || 0)
  const alreadyRefunded = Number(payment.refund_amount || 0)
  const availableForRefund = paymentAmount - alreadyRefunded

  if (rawAmount > availableForRefund + 0.01) {
    return NextResponse.json(
      {
        error: `amount เกินยอดที่เหลือคืนได้ (สูงสุด ${availableForRefund.toFixed(2)})`,
      },
      { status: 400 }
    )
  }

  // Run the Stripe refund.
  let stripeRefundId: string | null = null
  if (payment.stripe_payment_intent_id) {
    try {
      const amountInSatang = Math.round(rawAmount * 100)
      const result = await processStripeRefund(
        payment.stripe_payment_intent_id as string,
        amountInSatang
      )
      stripeRefundId = result.refundId
    } catch (err) {
      logger.error('manual refund Stripe error', { code, error: err })
      return NextResponse.json(
        { error: 'ไม่สามารถคืนเงินผ่าน Stripe ได้' },
        { status: 500 }
      )
    }
  }

  // Update payment.
  const newRefundTotal = alreadyRefunded + rawAmount
  const fullRefunded = Math.abs(newRefundTotal - paymentAmount) < 0.01
  const { error: payUpdateErr } = await supabase
    .from('payments')
    .update({
      status: fullRefunded ? 'REFUNDED' : (payment.status as string),
      stripe_refund_id: stripeRefundId || (payment.stripe_refund_id as string | null) || null,
      refund_amount: newRefundTotal,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', payment.id as string)

  if (payUpdateErr) {
    logger.error('manual refund payment update failed', { code, error: payUpdateErr })
    return NextResponse.json({ error: 'บันทึกการคืนเงินไม่สำเร็จ' }, { status: 500 })
  }

  // Optionally mark the booking as CANCELLED too.
  const bookingUpdate: Record<string, unknown> = {
    refund_amount: newRefundTotal,
    refund_percentage: Math.round((newRefundTotal / paymentAmount) * 100),
    refund_status: fullRefunded ? 'REFUNDED' : 'PARTIAL',
  }
  if (cancelBooking && booking.status !== 'CANCELLED') {
    bookingUpdate.status = 'CANCELLED'
    bookingUpdate.cancelled_at = new Date().toISOString()
    bookingUpdate.cancelled_by = 'admin'
    bookingUpdate.cancellation_reason = reason
  }
  const { error: bkUpdateErr } = await supabase
    .from('bookings')
    .update(bookingUpdate)
    .eq('booking_code', code)

  if (bkUpdateErr) {
    logger.error('manual refund booking update failed', { code, error: bkUpdateErr })
  }

  createAdminNotification({
    type: 'payment.refunded',
    title: `คืนเงินจำนวน ${rawAmount.toLocaleString()} บาท — ${code}`,
    body: reason,
    link: `/admin/bookings`,
    data: {
      booking_code: code,
      amount: rawAmount,
      cancel_booking: cancelBooking,
    },
    severity: 'warning',
  })

  return NextResponse.json({
    success: true,
    refund: {
      amount: rawAmount,
      stripe_refund_id: stripeRefundId,
      total_refunded: newRefundTotal,
      fully_refunded: fullRefunded,
    },
  })
}
