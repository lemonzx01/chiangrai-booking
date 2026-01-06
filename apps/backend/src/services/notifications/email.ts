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
import { APP_NAME } from '../../lib/constants'

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

/**
 * Interface สำหรับข้อมูลอีเมลแจ้งเตือนพาร์ทเนอร์โรงแรม
 */
interface HotelPartnerEmailData {
  /** อีเมลพาร์ทเนอร์ */
  partnerEmail: string
  /** ชื่อพาร์ทเนอร์ */
  partnerName: string
  /** รหัสการจอง */
  bookingCode: string
  /** ชื่อลูกค้า */
  customerName: string
  /** อีเมลลูกค้า */
  customerEmail: string
  /** เบอร์โทรลูกค้า */
  customerPhone: string
  /** วันที่เช็คอิน */
  checkIn: string
  /** วันที่เช็คเอาท์ */
  checkOut: string
  /** จำนวนผู้เข้าพัก */
  numberOfGuests: number
  /** ประเภทห้อง */
  roomType?: string
  /** คำขอพิเศษ */
  specialRequests?: string
  /** ราคารวม */
  totalPrice: number
  /** สกุลเงิน */
  currency: string
}

/**
 * Interface สำหรับข้อมูลอีเมลแจ้งเตือนพาร์ทเนอร์คนขับรถ
 */
interface DriverPartnerEmailData {
  /** อีเมลพาร์ทเนอร์ */
  partnerEmail: string
  /** ชื่อพาร์ทเนอร์ */
  partnerName: string
  /** รหัสการจอง */
  bookingCode: string
  /** ชื่อลูกค้า */
  customerName: string
  /** อีเมลลูกค้า */
  customerEmail: string
  /** เบอร์โทรลูกค้า */
  customerPhone: string
  /** วันที่รับรถ */
  pickupDate: string
  /** วันที่คืนรถ */
  returnDate: string
  /** จำนวนผู้โดยสาร */
  numberOfPassengers: number
  /** ชื่อรถ */
  carName: string
  /** คำขอพิเศษ */
  specialRequests?: string
  /** ราคารวม */
  totalPrice: number
  /** สกุลเงิน */
  currency: string
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

// ============================================================
// Send Hotel Partner Notification (ส่งอีเมลแจ้งเตือนโรงแรม)
// ============================================================

/**
 * ส่งอีเมลแจ้งเตือนไปหาพาร์ทเนอร์โรงแรมเมื่อมีการจอง
 *
 * @description ส่งอีเมลแจ้งโรงแรมเมื่อมีการจองห้องใหม่
 *              มีรายละเอียดการจองและข้อมูลลูกค้า
 *
 * @param data - ข้อมูลการจองและพาร์ทเนอร์
 * @returns ผลการส่งอีเมล หรือ null ถ้าไม่ได้ตั้งค่า Resend
 *
 * @example
 * await sendHotelPartnerNotification({
 *   partnerEmail: 'hotel@example.com',
 *   partnerName: 'โรงแรมตัวอย่าง',
 *   bookingCode: 'TE250101-XXXX',
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   customerPhone: '0812345678',
 *   checkIn: '2024-01-15',
 *   checkOut: '2024-01-18',
 *   numberOfGuests: 2,
 *   roomType: 'Deluxe Room',
 *   totalPrice: 15000,
 *   currency: 'THB'
 * })
 */
export async function sendHotelPartnerNotification(data: HotelPartnerEmailData) {
  const resend = getResend()

  // ถ้าไม่ได้ตั้งค่า Resend ให้ข้ามไป
  if (!resend) {
    console.log('Resend not configured, skipping partner email')
    return null
  }

  try {
    // ส่งอีเมล
    const result = await resend.emails.send({
      from: `${APP_NAME} <noreply@gotjourneythailand.com>`,
      to: data.partnerEmail,
      subject: `New Booking - ${data.bookingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">New Booking Received</h1>
          <p>Dear ${data.partnerName},</p>
          <p>You have received a new booking through ${APP_NAME}.</p>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1F2937;">Booking Details</h2>
            <p><strong>Booking Code:</strong> ${data.bookingCode}</p>
            <p><strong>Check-in:</strong> ${data.checkIn}</p>
            <p><strong>Check-out:</strong> ${data.checkOut}</p>
            <p><strong>Number of Guests:</strong> ${data.numberOfGuests}</p>
            ${data.roomType ? `<p><strong>Room Type:</strong> ${data.roomType}</p>` : ''}
            <p><strong>Total Price:</strong> ${formatCurrency(data.totalPrice, data.currency)}</p>
          </div>

          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1F2937;">Customer Information</h2>
            <p><strong>Name:</strong> ${data.customerName}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
            <p><strong>Phone:</strong> ${data.customerPhone}</p>
            ${data.specialRequests ? `<p><strong>Special Requests:</strong> ${data.specialRequests}</p>` : ''}
          </div>

          <p>Please prepare for the guest's arrival.</p>
          <p>Best regards,<br>${APP_NAME} Team</p>
        </div>
      `,
    })

    return result
  } catch (error) {
    console.error('Failed to send partner email:', error)
    return null
  }
}

// ============================================================
// Send Driver Partner Notification (ส่งอีเมลแจ้งเตือนคนขับรถ)
// ============================================================

/**
 * ส่งอีเมลแจ้งเตือนไปหาพาร์ทเนอร์คนขับรถเมื่อมีการจอง
 *
 * @description ส่งอีเมลแจ้งคนขับรถเมื่อมีการจองรถใหม่
 *              มีรายละเอียดการจองและข้อมูลลูกค้า
 *
 * @param data - ข้อมูลการจองและพาร์ทเนอร์
 * @returns ผลการส่งอีเมล หรือ null ถ้าไม่ได้ตั้งค่า Resend
 *
 * @example
 * await sendDriverPartnerNotification({
 *   partnerEmail: 'driver@example.com',
 *   partnerName: 'นายสมชาย ใจดี',
 *   bookingCode: 'TE250101-XXXX',
 *   customerName: 'John Doe',
 *   customerEmail: 'john@example.com',
 *   customerPhone: '0812345678',
 *   pickupDate: '2024-01-15',
 *   returnDate: '2024-01-18',
 *   numberOfPassengers: 4,
 *   carName: 'Toyota Alphard VIP',
 *   totalPrice: 19500,
 *   currency: 'THB'
 * })
 */
export async function sendDriverPartnerNotification(data: DriverPartnerEmailData) {
  const resend = getResend()

  // ถ้าไม่ได้ตั้งค่า Resend ให้ข้ามไป
  if (!resend) {
    console.log('Resend not configured, skipping partner email')
    return null
  }

  try {
    // ส่งอีเมล
    const result = await resend.emails.send({
      from: `${APP_NAME} <noreply@gotjourneythailand.com>`,
      to: data.partnerEmail,
      subject: `New Car Rental Booking - ${data.bookingCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">New Car Rental Booking</h1>
          <p>Dear ${data.partnerName},</p>
          <p>You have received a new car rental booking through ${APP_NAME}.</p>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1F2937;">Booking Details</h2>
            <p><strong>Booking Code:</strong> ${data.bookingCode}</p>
            <p><strong>Car:</strong> ${data.carName}</p>
            <p><strong>Pickup Date:</strong> ${data.pickupDate}</p>
            <p><strong>Return Date:</strong> ${data.returnDate}</p>
            <p><strong>Number of Passengers:</strong> ${data.numberOfPassengers}</p>
            <p><strong>Total Price:</strong> ${formatCurrency(data.totalPrice, data.currency)}</p>
          </div>

          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1F2937;">Customer Information</h2>
            <p><strong>Name:</strong> ${data.customerName}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
            <p><strong>Phone:</strong> ${data.customerPhone}</p>
            ${data.specialRequests ? `<p><strong>Special Requests:</strong> ${data.specialRequests}</p>` : ''}
          </div>

          <p>Please prepare the vehicle and confirm the pickup location with the customer.</p>
          <p>Best regards,<br>${APP_NAME} Team</p>
        </div>
      `,
    })

    return result
  } catch (error) {
    console.error('Failed to send partner email:', error)
    return null
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Format currency สำหรับแสดงในอีเมล
 */
function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    THB: '฿',
    USD: '$',
    EUR: '€',
  }

  const symbol = symbols[currency] || currency
  return `${symbol}${amount.toLocaleString()}`
}
