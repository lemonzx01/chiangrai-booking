/**
 * ============================================================
 * Email Service - บริการส่งอีเมลแจ้งเตือน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ส่งอีเมลยืนยันการจอง
 *   - ส่งอีเมลอัปเดตสถานะการจอง
 *   - ใช้ Brevo (formerly Sendinblue) API
 *
 * Environment Variables:
 *   - BREVO_API_KEY: API key สำหรับ Brevo
 *   - EMAIL_FROM_NAME: ชื่อผู้ส่ง (default: APP_NAME)
 *   - EMAIL_FROM_ADDRESS: อีเมลผู้ส่ง (default: noreply@gotjourneythailand.com)
 *
 * ฟังก์ชันหลัก:
 *   - sendEmail(): ส่งอีเมลทั่วไป
 *   - sendBookingConfirmationEmail(): ส่งอีเมลยืนยันการจอง
 *   - sendBookingStatusUpdateEmail(): ส่งอีเมลอัปเดตสถานะ
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import { APP_NAME } from '../../lib/constants'

// ============================================================
// Config
// ============================================================

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || APP_NAME
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@gotjourneythailand.com'

// ============================================================
// Generic Send Email Function
// ============================================================

/**
 * ส่งอีเมลผ่าน Brevo API
 *
 * @param options - ข้อมูลอีเมล (to, subject, html)
 * @returns ผลการส่งอีเมล หรือ null ถ้าไม่ได้ตั้งค่า
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}) {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    console.warn('[EMAIL] Brevo not configured - BREVO_API_KEY is not set. Email will not be sent.')
    console.warn('[EMAIL] To enable email service, set BREVO_API_KEY in .env.local')
    return null
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM_ADDRESS },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[EMAIL] Failed to send email:', {
        to: options.to,
        subject: options.subject,
        status: response.status,
        error: data,
      })
      return null
    }

    console.log('[EMAIL] Email sent successfully:', {
      to: options.to,
      subject: options.subject,
      messageId: data.messageId || 'unknown',
    })

    return { data }
  } catch (error: any) {
    console.error('[EMAIL] Exception while sending email:', {
      to: options.to,
      subject: options.subject,
      error: error?.message || String(error),
    })
    return null
  }
}

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Interface สำหรับข้อมูลอีเมลการจอง
 */
interface BookingEmailData {
  /** ชื่อลูกค้า */
  customerName: string
  /** อีเมลลูกค้า */
  customerEmail: string
  /** รหัสการจอง */
  bookingCode: string
  /** ประเภทการจอง */
  bookingType: 'HOTEL' | 'CAR' | 'COMBO'
  /** ชื่อรายการที่จอง */
  itemName: string
  /** วันที่เช็คอิน */
  checkIn: string
  /** วันที่เช็คเอาท์ */
  checkOut: string
  /** ราคารวม (บาท) */
  totalPrice: number
  /** สถานะการจอง */
  status: string
}


// ============================================================
// Send Booking Confirmation (ส่งอีเมลยืนยันการจอง)
// ============================================================

/**
 * ส่งอีเมลยืนยันการจอง
 *
 * @param data - ข้อมูลการจอง
 * @returns ผลการส่งอีเมล หรือ null
 */
export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  return sendEmail({
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
}

// ============================================================
// Send Status Update (ส่งอีเมลอัปเดตสถานะ)
// ============================================================

/**
 * ส่งอีเมลแจ้งอัปเดตสถานะการจอง
 *
 * @param email - อีเมลลูกค้า
 * @param bookingCode - รหัสการจอง
 * @param status - สถานะใหม่
 * @returns ผลการส่งอีเมล หรือ null
 */
export async function sendBookingStatusUpdateEmail(
  email: string,
  bookingCode: string,
  status: string
) {
  return sendEmail({
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
}
