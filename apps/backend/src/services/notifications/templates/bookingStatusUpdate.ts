/**
 * Email template — booking status update.
 */
import { APP_NAME } from '../../../lib/constants'
import { escapeHtml, wrapEmail } from './layout'

export function renderBookingStatusUpdateEmail(bookingCode: string, status: string) {
  const subject = `Booking Update - ${bookingCode}`
  const html = wrapEmail({
    heading: 'Booking Status Update',
    body: `
      <p>Your booking <strong>${escapeHtml(bookingCode)}</strong> has been updated.</p>
      <p>New status: <strong>${escapeHtml(status)}</strong></p>
      <p>Best regards,<br>${escapeHtml(APP_NAME)} Team</p>
    `,
  })
  return { subject, html }
}
