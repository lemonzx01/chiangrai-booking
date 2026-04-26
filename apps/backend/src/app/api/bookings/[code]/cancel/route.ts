/**
 * Cancel Booking API - ยกเลิกการจองและคืนเงิน
 *
 * POST /api/bookings/[code]/cancel
 *
 * Authentication:
 *   - User: ต้อง match email กับการจอง
 *   - Admin: ยกเลิกได้ทุกการจอง
 *
 * Body:
 *   - reason?: string - เหตุผลในการยกเลิก
 */
export const dynamic = 'force-dynamic'


import { createAdminClient } from '../../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyAdminToken, verifyUserToken } from '../../../../../lib/auth'
import { calculateRefundPercentage, calculateRefundAmount, processStripeRefund } from '../../../../../lib/refund'
import { sendCancellationNotification } from '../../../../../services/notifications/cancellation'
import { createAdminNotification } from '../../../../../services/notifications/admin-inbox'
import { logger } from '../../../../../lib/logger'
import { logAdminAction } from '../../../../../lib/audit'

interface Params {
  params: Promise<{ code: string }>
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { code } = await params
    const body = await request.json().catch(() => ({}))
    const reason = body.reason || ''

    // ตรวจสอบสิทธิ์
    const adminAuth = await verifyAdminToken()
    const userAuth = await verifyUserToken()

    const isAdmin = adminAuth.success
    const userEmail = userAuth.success ? userAuth.user?.email : null

    if (!isAdmin && !userEmail) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // ดึงข้อมูลการจอง
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, payment:payments(*)')
      .eq('booking_code', code)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 })
    }

    // ตรวจสอบสิทธิ์ user (ต้อง match email)
    if (!isAdmin && userEmail) {
      if (booking.customer_email.toLowerCase() !== userEmail.toLowerCase()) {
        return NextResponse.json({ error: 'ไม่มีสิทธิ์ยกเลิกการจองนี้' }, { status: 403 })
      }
    }

    // ตรวจสอบว่ายกเลิกได้หรือไม่
    const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PAID']
    if (!cancellableStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: `ไม่สามารถยกเลิกการจองที่มีสถานะ "${booking.status}" ได้` },
        { status: 400 }
      )
    }

    // คำนวณ refund
    const refundPercentage = calculateRefundPercentage(booking.check_in_date)
    const refundAmount = calculateRefundAmount(booking.total_price, refundPercentage)

    // หา payment record (ถ้ามี)
    const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment
    let stripeRefundId: string | null = null

    // ถ้ามีการจ่ายเงินแล้ว และมี refund > 0 -> เรียก Stripe Refund
    if (payment?.stripe_payment_intent_id && payment.status === 'SUCCEEDED' && refundAmount > 0) {
      try {
        // Stripe ใช้หน่วยย่อย (สตางค์ = x100)
        const amountInSatang = Math.round(refundAmount * 100)
        const result = await processStripeRefund(payment.stripe_payment_intent_id, amountInSatang)
        stripeRefundId = result.refundId
      } catch (stripeError: any) {
        logger.error('Stripe refund error', { error: stripeError })
        return NextResponse.json(
          { error: 'ไม่สามารถคืนเงินผ่าน Stripe ได้ กรุณาลองอีกครั้ง' },
          { status: 500 }
        )
      }
    }

    // อัพเดทการจอง
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancelled_by: isAdmin ? 'admin' : 'customer',
        cancellation_reason: reason,
        refund_amount: refundAmount,
        refund_percentage: refundPercentage,
        refund_status: refundAmount > 0
          ? (stripeRefundId ? 'REFUNDED' : 'PENDING')
          : 'NONE',
      })
      .eq('booking_code', code)
      .select('*, hotel:hotels(*), car:cars(*)')
      .single()

    if (updateError) {
      logger.error('Update booking error', { error: updateError })
      return NextResponse.json({ error: 'ไม่สามารถยกเลิกการจองได้' }, { status: 500 })
    }

    // อัพเดท payment record (ถ้ามี)
    if (payment) {
      if (stripeRefundId) {
        // มีการคืนเงินผ่าน Stripe สำเร็จ
        await supabase
          .from('payments')
          .update({
            status: 'REFUNDED',
            stripe_refund_id: stripeRefundId,
            refund_amount: refundAmount,
            refunded_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
      } else if (payment.status === 'PENDING') {
        // ยังไม่ได้ชำระเงิน → ยกเลิก payment
        await supabase
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('id', payment.id)
      }
    }

    // ส่ง email แจ้งยกเลิก (non-blocking)
    sendCancellationNotification(updatedBooking, refundAmount, refundPercentage).catch((err) =>
      logger.error('sendCancellationNotification failed', { error: err })
    )

    // Admin inbox notification
    createAdminNotification({
      type: 'booking.cancelled',
      title: `การจอง ${updatedBooking.booking_code} ถูกยกเลิก`,
      body: refundAmount > 0
        ? `คืนเงิน ${refundAmount.toLocaleString()} ${updatedBooking.currency || 'THB'} (${refundPercentage}%)`
        : 'ไม่มีการคืนเงิน',
      link: '/admin/bookings',
      data: {
        booking_id: updatedBooking.id,
        booking_code: updatedBooking.booking_code,
        refund_amount: refundAmount,
        refund_percentage: refundPercentage,
      },
      severity: refundAmount > 0 ? 'warning' : 'error',
    })

    // Audit only when an admin pulled the trigger — customer
    // self-cancellations are tracked via cancelled_by='customer'
    // on the booking row itself; we don't log every customer
    // action to the admin audit table.
    if (isAdmin && adminAuth.user) {
      logAdminAction({
        actor: adminAuth.user,
        request,
        action: 'booking.cancel',
        resource_type: 'booking',
        resource_id: code,
        metadata: {
          reason,
          refund_amount: refundAmount,
          refund_percentage: refundPercentage,
          stripe_refund_id: stripeRefundId,
        },
      })
    }

    return NextResponse.json({
      message: 'ยกเลิกการจองสำเร็จ',
      booking: updatedBooking,
      refund: {
        percentage: refundPercentage,
        amount: refundAmount,
        status: refundAmount > 0
          ? (stripeRefundId ? 'REFUNDED' : 'PENDING')
          : 'NONE',
      },
    })
  } catch (error) {
    logger.error('Cancel booking error', { error })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
