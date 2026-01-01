import { Resend } from 'resend'
import { APP_NAME } from '@/lib/constants'

// Lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

interface BookingEmailData {
  customerName: string
  customerEmail: string
  bookingCode: string
  bookingType: 'HOTEL' | 'CAR' | 'COMBO'
  itemName: string
  checkIn: string
  checkOut: string
  totalPrice: number
  status: string
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const resend = getResend()
  if (!resend) {
    console.log('Resend not configured, skipping email')
    return null
  }

  try {
    const result = await resend.emails.send({
      from: `${APP_NAME} <noreply@gotjourneythailand.com>`,
      to: data.customerEmail,
      subject: `Booking Confirmation - ${data.bookingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Booking Confirmed!</h1>
          <p>Dear ${data.customerName},</p>
          <p>Thank you for your booking with ${APP_NAME}.</p>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Booking Details</h2>
            <p><strong>Booking Code:</strong> ${data.bookingCode}</p>
            <p><strong>Item:</strong> ${data.itemName}</p>
            <p><strong>Check-in:</strong> ${data.checkIn}</p>
            <p><strong>Check-out:</strong> ${data.checkOut}</p>
            <p><strong>Total:</strong> ฿${data.totalPrice.toLocaleString()}</p>
            <p><strong>Status:</strong> ${data.status}</p>
          </div>

          <p>If you have any questions, please contact us.</p>
          <p>Best regards,<br>${APP_NAME} Team</p>
        </div>
      `,
    })
    return result
  } catch (error) {
    console.error('Failed to send email:', error)
    return null
  }
}

export async function sendBookingStatusUpdateEmail(
  email: string,
  bookingCode: string,
  status: string
) {
  const resend = getResend()
  if (!resend) {
    console.log('Resend not configured, skipping email')
    return null
  }

  try {
    const result = await resend.emails.send({
      from: `${APP_NAME} <noreply@gotjourneythailand.com>`,
      to: email,
      subject: `Booking Update - ${bookingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Booking Status Update</h1>
          <p>Your booking <strong>${bookingCode}</strong> has been updated.</p>
          <p>New status: <strong>${status}</strong></p>
          <p>Best regards,<br>${APP_NAME} Team</p>
        </div>
      `,
    })
    return result
  } catch (error) {
    console.error('Failed to send email:', error)
    return null
  }
}
