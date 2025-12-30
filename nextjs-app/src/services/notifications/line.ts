import { Booking, Hotel, Car } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

// Send Line Notify notification
export async function sendLineNotification(booking: Booking & { hotel?: Hotel; car?: Car }) {
  const token = process.env.LINE_NOTIFY_TOKEN

  if (!token) {
    console.log('Line Notify token not configured')
    return
  }

  const itemName =
    booking.booking_type === 'HOTEL'
      ? booking.hotel?.name_th || booking.hotel?.name_en || 'โรงแรม'
      : booking.car?.name_th || booking.car?.name_en || 'รถเช่า'

  const message = `
🔔 การจองใหม่!

📋 รหัสจอง: ${booking.booking_code}
📦 ประเภท: ${booking.booking_type === 'HOTEL' ? 'โรงแรม' : 'รถเช่า'}
🏨 รายการ: ${itemName}

👤 ลูกค้า: ${booking.customer_name}
📧 อีเมล: ${booking.customer_email}
📱 โทร: ${booking.customer_phone}
${booking.customer_line ? `💬 Line: ${booking.customer_line}` : ''}

📅 วันที่: ${formatDate(booking.check_in_date)} - ${formatDate(booking.check_out_date)}
👥 จำนวน: ${booking.number_of_guests} คน
💰 ราคารวม: ${formatCurrency(booking.total_price)}

${booking.special_requests ? `📝 หมายเหตุ: ${booking.special_requests}` : ''}
`

  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({ message }),
    })

    if (!response.ok) {
      console.error('Line Notify error:', await response.text())
    }

    return response.ok
  } catch (error) {
    console.error('Line Notify error:', error)
    return false
  }
}
