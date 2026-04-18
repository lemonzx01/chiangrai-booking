/**
 * Email template — booking cancellation with refund info.
 */
import { escapeHtml, renderDetailCard, wrapEmail } from './layout'

export interface BookingCancellationTemplateData {
  customerName: string
  bookingCode: string
  itemName: string
  checkIn: string
  checkOut: string
  currency: string
  refundAmount: number
  refundPercentage: number
  reason?: string | null
}

export function renderBookingCancellationEmail(data: BookingCancellationTemplateData) {
  const subject = `การจอง ${data.bookingCode} ถูกยกเลิก`

  const detailsCard = renderDetailCard('รายละเอียดการยกเลิก', [
    { label: 'รหัสการจอง', value: data.bookingCode },
    { label: 'รายการ', value: data.itemName },
    {
      label: 'วันที่',
      value: `${formatThaiDate(data.checkIn)} - ${formatThaiDate(data.checkOut)}`,
    },
    { label: 'เหตุผล', value: data.reason || '' },
  ], { background: '#FEF2F2', titleColor: '#991B1B' })

  const refundRow =
    data.refundAmount > 0
      ? `<p><strong>จำนวนเงินคืน:</strong> ${data.refundAmount.toLocaleString()} ${escapeHtml(
          data.currency
        )} (${data.refundPercentage}%)</p>
         <p style="font-size: 13px; color: #6B7280; margin-top: 8px;">เงินคืนจะเข้าบัญชีภายใน 5-10 วันทำการ</p>`
      : '<p>ไม่มีการคืนเงิน (ยกเลิกน้อยกว่า 3 วันก่อนวันเข้าพัก)</p>'

  const refundCard = `
    <div style="background:#F0FDF4;padding:18px 20px;border-radius:10px;margin:16px 0;">
      <h3 style="margin:0 0 12px 0;color:#166534;font-size:15px;font-weight:700;">การคืนเงิน</h3>
      ${refundRow}
    </div>
  `

  const html = wrapEmail({
    heading: 'การจองของคุณถูกยกเลิก',
    headingColor: '#DC2626',
    body: `
      <p>สวัสดีคุณ ${escapeHtml(data.customerName)},</p>
      <p>การจองของคุณได้ถูกยกเลิกเรียบร้อยแล้ว</p>
      ${detailsCard}
      ${refundCard}
    `,
  })

  return { subject, html }
}

function formatThaiDate(input: string): string {
  try {
    return new Date(input).toLocaleDateString('th-TH')
  } catch {
    return input
  }
}
