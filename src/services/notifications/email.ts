/**
 * ============================================================
 * Email Service - บริการส่งอีเมลแจ้งเตือน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ส่งอีเมลยืนยันการจอง
 *   - ส่งอีเมลอัปเดตสถานะการจอง
 *   - ใช้ Resend API สำหรับการส่งอีเมล
 *
 * Environment Variables:
 *   - RESEND_API_KEY: API key สำหรับ Resend
 *
 * ฟังก์ชันหลัก:
 *   - sendBookingConfirmationEmail(): ส่งอีเมลยืนยันการจอง
 *   - sendBookingStatusUpdateEmail(): ส่งอีเมลอัปเดตสถานะ
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import { Resend } from 'resend'
import { APP_NAME } from '@/lib/constants'

// ============================================================
// Resend Client (Singleton Pattern)
// ============================================================

/**
 * ตัวแปรเก็บ Resend instance
 * @description ใช้ Lazy initialization เพื่อหลีกเลี่ยง error ตอน build
 */
let resendInstance: Resend | null = null

/**
 * ดึง Resend instance
 *
 * @description สร้าง Resend client ถ้ามี API key
 *              คืนค่า null ถ้าไม่ได้ตั้งค่า
 *
 * @returns Resend instance หรือ null
 */
function getResend(): Resend | null {
  // ตรวจสอบว่ามี API key หรือไม่
  if (!process.env.RESEND_API_KEY) {
    return null
  }

  // สร้าง instance ถ้ายังไม่มี (Singleton)
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }

  return resendInstance
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
 * @description ส่งอีเมลแจ้งลูกค้าเมื่อสร้างการจองใหม่
 *              มีรายละเอียดการจองครบถ้วน
 *
 * @param data - ข้อมูลการจอง
 * @returns ผลการส่งอีเมล หรือ null ถ้าไม่ได้ตั้งค่า Resend
 *
 * @example
 * await sendBookingConfirmationEmail({
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   bookingCode: 'TE250101-XXXX',
 *   bookingType: 'HOTEL',
 *   itemName: 'Phuket Ocean Drive Package',
 *   checkIn: '2024-01-15',
 *   checkOut: '2024-01-18',
 *   totalPrice: 38700,
 *   status: 'CONFIRMED'
 * })
 */
export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const resend = getResend()

  // ถ้าไม่ได้ตั้งค่า Resend ให้ข้ามไป
  if (!resend) {
    console.log('Resend not configured, skipping email')
    return null
  }

  try {
    // ส่งอีเมล
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

// ============================================================
// Send Status Update (ส่งอีเมลอัปเดตสถานะ)
// ============================================================

/**
 * ส่งอีเมลแจ้งอัปเดตสถานะการจอง
 *
 * @description ส่งอีเมลแจ้งลูกค้าเมื่อสถานะการจองเปลี่ยน
 *
 * @param email - อีเมลลูกค้า
 * @param bookingCode - รหัสการจอง
 * @param status - สถานะใหม่
 * @returns ผลการส่งอีเมล หรือ null ถ้าไม่ได้ตั้งค่า Resend
 *
 * @example
 * await sendBookingStatusUpdateEmail(
 *   'john@example.com',
 *   'TE250101-XXXX',
 *   'PAID'
 * )
 */
export async function sendBookingStatusUpdateEmail(
  email: string,
  bookingCode: string,
  status: string
) {
  const resend = getResend()

  // ถ้าไม่ได้ตั้งค่า Resend ให้ข้ามไป
  if (!resend) {
    console.log('Resend not configured, skipping email')
    return null
  }

  try {
    // ส่งอีเมล
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
