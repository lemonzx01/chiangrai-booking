import { Resend } from 'resend'
import { Booking, Hotel, Car } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

// Lazy initialization
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

// Send booking confirmation email to customer
export async function sendBookingConfirmationEmail(
  booking: Booking & { hotel?: Hotel; car?: Car }
) {
  const resend = getResend()
  if (!resend) {
    console.log('Resend API key not configured')
    return
  }

  const itemName =
    booking.booking_type === 'HOTEL'
      ? booking.hotel?.name_en || 'Hotel'
      : booking.car?.name_en || 'Car Rental'

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Waygo Thailand</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Booking Confirmation</p>
  </div>

  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1e293b; margin-top: 0;">Thank you for your booking!</h2>

    <p>Dear ${booking.customer_name},</p>
    <p>Your booking has been confirmed. Here are your booking details:</p>

    <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Booking Code:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #4f46e5;">${booking.booking_code}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Item:</td>
          <td style="padding: 8px 0; font-weight: bold;">${itemName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Check-in:</td>
          <td style="padding: 8px 0;">${formatDate(booking.check_in_date, 'en-US')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Check-out:</td>
          <td style="padding: 8px 0;">${formatDate(booking.check_out_date, 'en-US')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Guests:</td>
          <td style="padding: 8px 0;">${booking.number_of_guests}</td>
        </tr>
        <tr style="border-top: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #64748b; font-weight: bold;">Total:</td>
          <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: #4f46e5;">${formatCurrency(booking.total_price)}</td>
        </tr>
      </table>
    </div>

    ${booking.special_requests ? `
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <strong>Special Requests:</strong>
      <p style="margin: 5px 0 0 0;">${booking.special_requests}</p>
    </div>
    ` : ''}

    <p style="color: #64748b; font-size: 14px;">
      If you have any questions, please don't hesitate to contact us at
      <a href="mailto:hello@waygothailand.com" style="color: #4f46e5;">hello@waygothailand.com</a>
    </p>
  </div>

  <div style="background: #1e293b; padding: 20px; border-radius: 0 0 16px 16px; text-align: center;">
    <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 12px;">
      © 2024 Waygo Thailand. All rights reserved.
    </p>
  </div>
</body>
</html>
`

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Waygo Thailand <noreply@waygothailand.com>',
      to: booking.customer_email,
      subject: `Booking Confirmed - ${booking.booking_code}`,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}
