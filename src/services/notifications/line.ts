import { APP_NAME } from '@/lib/constants'

interface LineNotifyConfig {
  accessToken: string
}

// LINE Notify API endpoint
const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify'

function getLineConfig(): LineNotifyConfig | null {
  if (!process.env.LINE_NOTIFY_TOKEN) {
    return null
  }
  return {
    accessToken: process.env.LINE_NOTIFY_TOKEN,
  }
}

interface BookingNotificationData {
  bookingCode: string
  customerName: string
  customerPhone: string
  bookingType: 'HOTEL' | 'CAR' | 'COMBO'
  itemName: string
  checkIn: string
  checkOut: string
  totalPrice: number
}

export async function sendLineNotification(message: string) {
  const config = getLineConfig()
  if (!config) {
    console.log('LINE Notify not configured, skipping notification')
    return null
  }

  try {
    const response = await fetch(LINE_NOTIFY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: new URLSearchParams({ message }),
    })

    if (!response.ok) {
      throw new Error(`LINE Notify failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to send LINE notification:', error)
    return null
  }
}

export async function sendNewBookingNotification(data: BookingNotificationData) {
  const bookingTypeLabel = {
    HOTEL: 'แพ็คเกจ',
    CAR: 'รถเช่า',
    COMBO: 'แพ็คเกจรวม',
  }

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

export async function sendBookingStatusNotification(
  bookingCode: string,
  status: string,
  customerName: string
) {
  const statusLabels: Record<string, string> = {
    PENDING: 'รอดำเนินการ',
    CONFIRMED: 'ยืนยันแล้ว',
    PAID: 'ชำระเงินแล้ว',
    CANCELLED: 'ยกเลิก',
    COMPLETED: 'เสร็จสิ้น',
  }

  const message = `
📢 ${APP_NAME} - อัพเดทสถานะ

📋 รหัส: ${bookingCode}
👤 ลูกค้า: ${customerName}
📊 สถานะใหม่: ${statusLabels[status] || status}
`

  return sendLineNotification(message)
}
