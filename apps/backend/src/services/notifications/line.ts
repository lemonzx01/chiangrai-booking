/**
 * ============================================================
 * LINE Notification Service - บริการแจ้งเตือนผ่าน LINE
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ส่งการแจ้งเตือนไปยัง LINE Notify
 *   - แจ้งเตือนเมื่อมีการจองใหม่
 *   - แจ้งเตือนเมื่อสถานะการจองเปลี่ยน
 *
 * Environment Variables:
 *   - LINE_NOTIFY_TOKEN: Token สำหรับ LINE Notify
 *
 * ฟังก์ชันหลัก:
 *   - sendLineNotification(): ส่งข้อความไปยัง LINE
 *   - sendNewBookingNotification(): แจ้งเตือนการจองใหม่
 *   - sendBookingStatusNotification(): แจ้งเตือนการเปลี่ยนสถานะ
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import { APP_NAME } from '@/lib/constants'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Interface สำหรับ LINE Notify configuration
 */
interface LineNotifyConfig {
  /** Access token สำหรับ LINE Notify */
  accessToken: string
}

/**
 * Interface สำหรับข้อมูลการแจ้งเตือนการจอง
 */
interface BookingNotificationData {
  /** รหัสการจอง */
  bookingCode: string
  /** ชื่อลูกค้า */
  customerName: string
  /** เบอร์โทรลูกค้า */
  customerPhone: string
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
}

// ============================================================
// Constants (ค่าคงที่)
// ============================================================

/** LINE Notify API endpoint */
const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify'

// ============================================================
// Configuration (การตั้งค่า)
// ============================================================

/**
 * ดึง LINE Notify configuration
 *
 * @description ตรวจสอบ environment variable และคืนค่า config
 *
 * @returns Config object หรือ null ถ้าไม่ได้ตั้งค่า
 */
function getLineConfig(): LineNotifyConfig | null {
  // ตรวจสอบว่ามี token หรือไม่
  if (!process.env.LINE_NOTIFY_TOKEN) {
    return null
  }

  return {
    accessToken: process.env.LINE_NOTIFY_TOKEN,
  }
}

// ============================================================
// Send Notification (ส่งการแจ้งเตือน)
// ============================================================

/**
 * ส่งข้อความไปยัง LINE Notify
 *
 * @description ส่งข้อความแจ้งเตือนไปยัง LINE group/user ที่เชื่อมต่อ
 *
 * @param message - ข้อความที่ต้องการส่ง
 * @returns ผลลัพธ์จาก API หรือ null ถ้าไม่ได้ตั้งค่า
 *
 * @example
 * await sendLineNotification('มีการจองใหม่!')
 */
export async function sendLineNotification(message: string) {
  const config = getLineConfig()

  // ถ้าไม่ได้ตั้งค่า LINE Notify ให้ข้ามไป
  if (!config) {
    console.log('LINE Notify not configured, skipping notification')
    return null
  }

  try {
    // ส่ง request ไปยัง LINE Notify API
    const response = await fetch(LINE_NOTIFY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: new URLSearchParams({ message }),
    })

    // ตรวจสอบผลลัพธ์
    if (!response.ok) {
      throw new Error(`LINE Notify failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to send LINE notification:', error)
    return null
  }
}

// ============================================================
// New Booking Notification (แจ้งเตือนการจองใหม่)
// ============================================================

/**
 * ส่งการแจ้งเตือนเมื่อมีการจองใหม่
 *
 * @description ส่งข้อความแจ้งเตือนพร้อมรายละเอียดการจองครบถ้วน
 *              สำหรับแจ้ง admin/staff
 *
 * @param data - ข้อมูลการจอง
 * @returns ผลลัพธ์จาก API หรือ null
 *
 * @example
 * await sendNewBookingNotification({
 *   bookingCode: 'TE250101-XXXX',
 *   customerName: 'สมชาย',
 *   customerPhone: '0812345678',
 *   bookingType: 'HOTEL',
 *   itemName: 'Phuket Ocean Drive',
 *   checkIn: '2024-01-15',
 *   checkOut: '2024-01-18',
 *   totalPrice: 38700
 * })
 */
export async function sendNewBookingNotification(data: BookingNotificationData) {
  // แปลงประเภทการจองเป็นภาษาไทย
  const bookingTypeLabel = {
    HOTEL: 'แพ็คเกจ',
    CAR: 'รถเช่า',
    COMBO: 'แพ็คเกจรวม',
  }

  // สร้างข้อความแจ้งเตือน
  const message = `
🔔 ${APP_NAME} - การจองใหม่!

📋 รหัสการจอง: ${data.bookingCode}
👤 ลูกค้า: ${data.customerName}
📞 โทร: ${data.customerPhone}

📦 ประเภท: ${bookingTypeLabel[data.bookingType]}
🏨 รายการ: ${data.itemName}
📅 เช็คอิน: ${data.checkIn}
📅 เช็คเอาท์: ${data.checkOut}
💰 ราคารวม: ฿${data.totalPrice.toLocaleString()}
`

  return sendLineNotification(message)
}

// ============================================================
// Status Update Notification (แจ้งเตือนการเปลี่ยนสถานะ)
// ============================================================

/**
 * ส่งการแจ้งเตือนเมื่อสถานะการจองเปลี่ยน
 *
 * @description ส่งข้อความแจ้งเตือนสถานะใหม่ของการจอง
 *
 * @param bookingCode - รหัสการจอง
 * @param status - สถานะใหม่
 * @param customerName - ชื่อลูกค้า
 * @returns ผลลัพธ์จาก API หรือ null
 *
 * @example
 * await sendBookingStatusNotification('TE250101-XXXX', 'PAID', 'สมชาย')
 */
export async function sendBookingStatusNotification(
  bookingCode: string,
  status: string,
  customerName: string
) {
  // แปลงสถานะเป็นภาษาไทย
  const statusLabels: Record<string, string> = {
    PENDING: 'รอดำเนินการ',
    CONFIRMED: 'ยืนยันแล้ว',
    PAID: 'ชำระเงินแล้ว',
    CANCELLED: 'ยกเลิก',
    COMPLETED: 'เสร็จสิ้น',
  }

  // สร้างข้อความแจ้งเตือน
  const message = `
📢 ${APP_NAME} - อัพเดทสถานะ

📋 รหัส: ${bookingCode}
👤 ลูกค้า: ${customerName}
📊 สถานะใหม่: ${statusLabels[status] || status}
`

  return sendLineNotification(message)
}
