/**
 * Cancellation Notification Service - แจ้งเตือนการยกเลิกการจอง
 */

import { sendEmail } from './email'

/**
 * ส่งอีเมลแจ้งยกเลิกการจองให้ลูกค้า
 */
export async function sendCancellationNotification(
  booking: any,
  refundAmount: number,
  refundPercentage: number
): Promise<void> {
  try {
    const itemName = booking.hotel?.name_th || booking.hotel?.name_en ||
                     booking.car?.name_th || booking.car?.name_en || 'รายการ'

    const refundText = refundAmount > 0
      ? `<p><strong>จำนวนเงินคืน:</strong> ${refundAmount.toLocaleString()} ${booking.currency || 'THB'} (${refundPercentage}%)</p>`
      : '<p>ไม่มีการคืนเงิน (ยกเลิกน้อยกว่า 3 วันก่อนวันเข้าพัก)</p>'

    const subject = `การจอง ${booking.booking_code} ถูกยกเลิก`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">การจองของคุณถูกยกเลิก</h2>
        <p>สวัสดีคุณ ${booking.customer_name},</p>
        <p>การจองของคุณได้ถูกยกเลิกเรียบร้อยแล้ว</p>

        <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #991B1B;">รายละเอียดการยกเลิก</h3>
          <p><strong>รหัสการจอง:</strong> ${booking.booking_code}</p>
          <p><strong>รายการ:</strong> ${itemName}</p>
          <p><strong>วันที่:</strong> ${new Date(booking.check_in_date).toLocaleDateString('th-TH')} - ${new Date(booking.check_out_date).toLocaleDateString('th-TH')}</p>
          ${booking.cancellation_reason ? `<p><strong>เหตุผล:</strong> ${booking.cancellation_reason}</p>` : ''}
        </div>

        <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #166534;">การคืนเงิน</h3>
          ${refundText}
          ${refundAmount > 0 ? '<p style="font-size: 14px; color: #6B7280;">เงินคืนจะเข้าบัญชีภายใน 5-10 วันทำการ</p>' : ''}
        </div>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          นี่เป็นอีเมลอัตโนมัติ กรุณาอย่าตอบกลับ
        </p>
      </div>
    `

    await sendEmail({
      to: booking.customer_email,
      subject,
      html,
    })
  } catch (error) {
    console.error('Error sending cancellation notification:', error)
  }
}
