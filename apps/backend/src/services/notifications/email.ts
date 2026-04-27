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
import { isEmailMockMode } from '../../lib/auth'
import { logger } from '../../lib/logger'
import { renderBookingConfirmationEmail } from './templates/bookingConfirmation'
import { renderBookingStatusUpdateEmail } from './templates/bookingStatusUpdate'

// ============================================================
// Config
// ============================================================

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const RESEND_API_URL = 'https://api.resend.com/emails'
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || APP_NAME
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@gotjourneythailand.com'

// ============================================================
// Generic Send Email Function
// ============================================================

/**
 * ส่งอีเมล — รองรับทั้ง Resend, Brevo และ Mock mode
 *
 * @description Strategy:
 *   1. Mock mode (no key set) → log and return fake messageId
 *   2. RESEND_API_KEY set → use Resend
 *   3. BREVO_API_KEY set → use Brevo
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}) {
  // ----- Mock mode -----
  if (isEmailMockMode()) {
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    logger.info('mock email sent', {
      to: options.to,
      subject: options.subject,
      messageId,
    })
    return { data: { messageId } }
  }

  // ----- Resend (preferred if both set) -----
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        logger.error('resend send failed', {
          to: options.to,
          subject: options.subject,
          status: response.status,
          error: data,
        })
        return null
      }
      logger.info('resend email sent', {
        to: options.to,
        subject: options.subject,
        messageId: data.id || 'unknown',
      })
      return { data: { messageId: data.id, ...data } }
    } catch (error: any) {
      logger.error('resend exception', {
        to: options.to,
        subject: options.subject,
        error: error?.message || String(error),
      })
      return null
    }
  }

  // ----- Brevo fallback -----
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    // Should be unreachable thanks to isEmailMockMode() above, but be safe.
    logger.warn('email not configured', { to: options.to, subject: options.subject })
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
      logger.error('brevo send failed', {
        to: options.to,
        subject: options.subject,
        status: response.status,
        error: data,
      })
      return null
    }

    logger.info('brevo email sent', {
      to: options.to,
      subject: options.subject,
      messageId: data.messageId || 'unknown',
    })

    return { data: { messageId: data.messageId, ...data } }
  } catch (error: any) {
    logger.error('brevo exception', {
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
  // Build a "view your booking" URL that takes the customer to
  // the dedicated detail page. Email is included as a query
  // hint so the page can authenticate without forcing login.
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://gotjourneythailand.com'
  ).replace(/\/$/, '')
  const bookingUrl = `${siteUrl}/bookings/${data.bookingCode}?email=${encodeURIComponent(data.customerEmail)}`

  const { subject, html } = renderBookingConfirmationEmail({
    customerName: data.customerName,
    bookingCode: data.bookingCode,
    itemName: data.itemName,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    totalPrice: data.totalPrice,
    status: data.status,
    bookingUrl,
  })
  return sendEmail({ to: data.customerEmail, subject, html })
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
  const { subject, html } = renderBookingStatusUpdateEmail(bookingCode, status)
  return sendEmail({ to: email, subject, html })
}
