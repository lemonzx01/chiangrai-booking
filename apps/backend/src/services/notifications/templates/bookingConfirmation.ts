/**
 * Email template — booking confirmation (customer copy).
 */
import { APP_NAME } from '../../../lib/constants'
import { escapeHtml, renderDetailCard, wrapEmail } from './layout'

export interface BookingConfirmationTemplateData {
  customerName: string
  bookingCode: string
  itemName: string
  checkIn: string
  checkOut: string
  totalPrice: number
  status: string
}

export function renderBookingConfirmationEmail(data: BookingConfirmationTemplateData) {
  const subject = `Booking Confirmation - ${data.bookingCode}`

  const detailCard = renderDetailCard('Booking Details', [
    { label: 'Booking Code', value: data.bookingCode },
    { label: 'Item', value: data.itemName },
    { label: 'Check-in', value: data.checkIn },
    { label: 'Check-out', value: data.checkOut },
    { label: 'Total', value: `฿${data.totalPrice.toLocaleString()}` },
    { label: 'Status', value: data.status },
  ])

  const html = wrapEmail({
    heading: 'Booking Confirmed!',
    body: `
      <p>Dear ${escapeHtml(data.customerName)},</p>
      <p>Thank you for your booking with ${escapeHtml(APP_NAME)}.</p>
      ${detailCard}
      <p>If you have any questions, please contact us.</p>
      <p>Best regards,<br>${escapeHtml(APP_NAME)} Team</p>
    `,
  })

  return { subject, html }
}
