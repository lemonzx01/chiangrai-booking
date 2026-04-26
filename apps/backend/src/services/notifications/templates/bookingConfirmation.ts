/**
 * Email template — booking confirmation (customer copy).
 *
 * Bilingual: Thai is primary, English follows in italics. Most
 * customers are Thai but a meaningful share book in English, and
 * showing both languages avoids the "wait what does this say?"
 * call to support.
 */
import { APP_NAME } from '../../../lib/constants'
import {
  escapeHtml,
  renderAmountHero,
  renderDetailCard,
  renderTrustBadges,
  wrapEmail,
  BRAND,
} from './layout'

export interface BookingConfirmationTemplateData {
  customerName: string
  bookingCode: string
  itemName: string
  checkIn: string
  checkOut: string
  totalPrice: number
  status: string
  /** Optional URL the customer can use to view the booking. */
  bookingUrl?: string
  /** Currency code (default THB). */
  currency?: string
}

export function renderBookingConfirmationEmail(
  data: BookingConfirmationTemplateData
) {
  const subject = `✓ ยืนยันการจอง ${data.bookingCode} — ${APP_NAME}`
  const currency = data.currency || 'THB'

  const amountHero = renderAmountHero(
    'ยอดที่ชำระ / Amount paid',
    `${formatAmount(data.totalPrice)} ${currency}`
  )

  const detailCard = renderDetailCard('รายละเอียดการจอง / Booking details', [
    { label: 'รหัสการจอง', value: data.bookingCode },
    { label: 'รายการ', value: data.itemName },
    { label: 'วันเช็คอิน', value: formatDate(data.checkIn) },
    { label: 'วันเช็คเอาท์', value: formatDate(data.checkOut) },
    { label: 'สถานะ', value: data.status },
  ])

  const cta = data.bookingUrl
    ? { label: 'ดูรายละเอียดการจอง', url: data.bookingUrl }
    : undefined

  const html = wrapEmail({
    preheader: `จองสำเร็จ ${data.bookingCode} — ${data.itemName}`,
    eyebrow: 'จองสำเร็จ / Booking confirmed',
    heading: `ขอบคุณที่จองกับเรา`,
    subheading: `Hello ${data.customerName} — your trip with ${APP_NAME} is locked in.`,
    body: `
      <p style="margin:16px 0 8px 0;">สวัสดีคุณ <strong>${escapeHtml(data.customerName)}</strong>,</p>
      <p style="margin:8px 0;">เราได้รับการจองของคุณเรียบร้อยแล้ว รายละเอียดด้านล่างนี้สามารถนำไปแสดงตอนเช็คอินได้เลย</p>
      <p style="margin:0 0 16px 0;font-style:italic;color:${BRAND.muted};font-size:14px;">We've received your booking. The details below are everything you need at check-in.</p>

      ${amountHero}
      ${detailCard}

      <p style="margin:20px 0 8px 0;font-weight:600;">สิ่งที่จะเกิดขึ้นต่อไป / What's next:</p>
      <ul style="margin:8px 0 16px 0;padding-left:20px;color:${BRAND.muted};font-size:14px;line-height:1.7;">
        <li>เก็บอีเมลนี้ไว้เป็นหลักฐาน — show this email at check-in</li>
        <li>ทีมงานของเราจะติดต่อ 24 ชม. ก่อนถึงวันเช็คอิน — we'll reach out 24h before</li>
        <li>หากต้องการเปลี่ยนแปลงหรือยกเลิก ทักเราได้ทาง LINE — message us on LINE for changes</li>
      </ul>

      ${renderTrustBadges()}
    `,
    cta,
    footerNote:
      "หากคุณไม่ได้ทำการจองนี้ กรุณาติดต่อเราทันที / If you didn't make this booking, please contact us immediately.",
  })

  return { subject, html }
}

// ---------------------------------------------------------------
// Formatting helpers (kept local to the template — different
// templates may want different formats)
// ---------------------------------------------------------------

function formatAmount(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

function formatDate(iso: string): string {
  // Return both Thai-locale and ISO so customers see "27 เม.ย. 2569"
  // alongside "2026-04-27" — date confusion is the most expensive
  // booking error and worth eating two extra characters per row.
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const th = d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${th} (${iso.slice(0, 10)})`
  } catch {
    return iso
  }
}
