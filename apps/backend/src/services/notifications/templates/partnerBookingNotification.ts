/**
 * Email template — notify partner of a new booking.
 */
import { escapeHtml, renderDetailCard, wrapEmail } from './layout'

export interface PartnerBookingTemplateData {
  ownerName: string
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

export function renderPartnerBookingNotificationEmail(data: PartnerBookingTemplateData) {
  const isHotel = data.bookingType === 'HOTEL'
  const itemTypeTh = isHotel ? 'โรงแรม' : 'รถเช่า'
  const subject = `มีการจองใหม่: ${data.itemName}`

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
    heading: 'มีการจองใหม่!',
    body: `
      <p>สวัสดีคุณ ${escapeHtml(data.ownerName)},</p>
      <p>มีลูกค้าจอง${itemTypeTh}ของคุณแล้ว:</p>
      ${card}
      <p>กรุณาตรวจสอบและยืนยันการจองในระบบ</p>
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
