/**
 * Email template — notify admin of a new booking.
 */
import { renderDetailCard, wrapEmail } from './layout'

export interface AdminBookingTemplateData {
  bookingCode: string
  itemName: string
  bookingType: 'HOTEL' | 'CAR' | 'COMBO' | string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  checkIn: string
  checkOut: string
  totalPrice: number
  currency: string
}

export function renderAdminBookingNotificationEmail(data: AdminBookingTemplateData) {
  const isHotel = data.bookingType === 'HOTEL'
  const itemTypeTh = isHotel ? 'โรงแรม' : 'รถเช่า'
  const subject = `มีการจองใหม่: ${data.bookingCode}`

  const card = renderDetailCard('รายละเอียดการจอง', [
    { label: 'รหัสการจอง', value: data.bookingCode },
    { label: 'รายการ', value: data.itemName },
    { label: 'ลูกค้า', value: data.customerName },
    { label: 'อีเมล', value: data.customerEmail },
    { label: 'โทรศัพท์', value: data.customerPhone || '' },
    {
      label: 'วันที่',
      value: `${formatThai(data.checkIn)} - ${formatThai(data.checkOut)}`,
    },
    {
      label: 'ราคารวม',
      value: `${data.totalPrice.toLocaleString()} ${data.currency}`,
    },
  ])

  const html = wrapEmail({
    heading: 'มีการจองใหม่ในระบบ',
    body: `
      <p>มีลูกค้าจอง${itemTypeTh}แล้ว:</p>
      ${card}
    `,
  })

  return { subject, html }
}

function formatThai(input: string): string {
  try {
    return new Date(input).toLocaleDateString('th-TH')
  } catch {
    return input
  }
}
