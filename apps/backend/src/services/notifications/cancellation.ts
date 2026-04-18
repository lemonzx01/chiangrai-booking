/**
 * Cancellation Notification Service - แจ้งเตือนการยกเลิกการจอง
 */

import { sendEmail } from './email'
import { logger } from '../../lib/logger'
import { renderBookingCancellationEmail } from './templates/bookingCancellation'

/**
 * ส่งอีเมลแจ้งยกเลิกการจองให้ลูกค้า
 */
export async function sendCancellationNotification(
  booking: any,
  refundAmount: number,
  refundPercentage: number
): Promise<void> {
  try {
    const itemName =
      booking.hotel?.name_th ||
      booking.hotel?.name_en ||
      booking.car?.name_th ||
      booking.car?.name_en ||
      'รายการ'

    const { subject, html } = renderBookingCancellationEmail({
      customerName: booking.customer_name,
      bookingCode: booking.booking_code,
      itemName,
      checkIn: booking.check_in_date,
      checkOut: booking.check_out_date,
      currency: booking.currency || 'THB',
      refundAmount,
      refundPercentage,
      reason: booking.cancellation_reason || null,
    })

    await sendEmail({ to: booking.customer_email, subject, html })
  } catch (error) {
    logger.error('cancellation notification failed', { error })
  }
}
