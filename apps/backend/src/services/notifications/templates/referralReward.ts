/**
 * ============================================================
 * Referral Reward email — sent to BOTH sides
 * ============================================================
 *
 * One template, two flavors: 'referrer' (you invited a friend
 * and they booked) and 'referee' (you booked, here's your
 * welcome bonus). Same look, different copy.
 *
 * Why one template instead of two: the layout, brand, and
 * structure are identical. Forking the file would mean two
 * places to update if we tweak the discount or the copy.
 * ============================================================
 */

import { wrapEmail, escapeHtml, BRAND } from './layout'

interface ReferralRewardInput {
  /** 'referrer' = the one who invited; 'referee' = the new signup */
  side: 'referrer' | 'referee'
  recipientName: string | null
  /** The other party's display name (referee's name for referrer email, vice versa) */
  otherPartyName: string | null
  couponCode: string
  /** Discount amount, e.g. "10%" or "฿500" */
  discountLabel: string
  /** When the coupon expires, ISO string */
  expiresAt: string
  /** Link the user clicks to start booking */
  ctaUrl: string
}

export function renderReferralRewardEmail(input: ReferralRewardInput): {
  subject: string
  html: string
} {
  const isReferrer = input.side === 'referrer'

  // Subject lines kept short to survive Gmail's preview truncation.
  const subject = isReferrer
    ? `🎁 ${input.otherPartyName || 'เพื่อนของคุณ'} จองสำเร็จแล้ว — รับคูปองส่วนลด`
    : `🎉 ขอบคุณที่จอง! นี่คือคูปองต้อนรับของคุณ`

  const greeting = input.recipientName
    ? `สวัสดีคุณ ${escapeHtml(input.recipientName)}`
    : 'สวัสดี'

  const intro = isReferrer
    ? `เพื่อนที่คุณชวน ${
        input.otherPartyName ? `(${escapeHtml(input.otherPartyName)}) ` : ''
      }เพิ่งจองและชำระเงินสำเร็จ — ขอบคุณที่ช่วยแนะนำเรา 🙏`
    : `ขอบคุณที่จองกับเรา — เพื่อนที่ชวนคุณมาก็ได้รับคูปองเช่นกัน`

  const expires = new Date(input.expiresAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Big code box — the central piece of the email.
  const codeBox = `
    <div style="margin:24px 0;padding:20px;border-radius:12px;background:linear-gradient(135deg,${BRAND.primary}10 0%,${BRAND.primaryDark}1a 100%);border:1px dashed ${BRAND.primary};text-align:center;">
      <div style="color:${BRAND.muted};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">โค้ดส่วนลด / Coupon Code</div>
      <div style="font-family:'Courier New',monospace;color:${BRAND.ink};font-size:28px;font-weight:800;letter-spacing:3px;margin-bottom:8px;">
        ${escapeHtml(input.couponCode)}
      </div>
      <div style="color:${BRAND.primary};font-size:14px;font-weight:600;">
        ส่วนลด ${escapeHtml(input.discountLabel)}
      </div>
      <div style="color:${BRAND.muted};font-size:12px;margin-top:8px;">
        ใช้ได้ถึง ${expires}
      </div>
    </div>
  `

  const finePrint = `
    <div style="margin-top:16px;padding:12px;border-radius:8px;background:${BRAND.surface};color:${BRAND.muted};font-size:12px;line-height:1.6;">
      <strong style="color:${BRAND.ink};">เงื่อนไข:</strong>
      คูปองนี้ผูกกับอีเมลของคุณ ใช้ได้ครั้งเดียว
      สำหรับการจองโรงแรมหรือรถเช่า
      ใช้ได้จนถึงวันที่ระบุ — ใช้ได้ทันทีในการจองครั้งถัดไป
    </div>
  `

  const body = `
    <p style="margin:0 0 12px 0;font-size:15px;">${greeting},</p>
    <p style="margin:0 0 8px 0;font-size:15px;line-height:1.65;">${intro}</p>
    ${codeBox}
    <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">
      คัดลอกโค้ดด้านบน แล้วใส่ในช่องคูปองตอนชำระเงินครั้งหน้า
    </p>
    ${finePrint}
  `

  const html = wrapEmail({
    preheader: isReferrer
      ? 'เพื่อนของคุณจองแล้ว — รับคูปองส่วนลดเป็นรางวัลขอบคุณ'
      : 'ขอบคุณที่จองกับเรา — รับคูปองต้อนรับสำหรับการจองครั้งถัดไป',
    eyebrow: isReferrer ? 'รางวัลแนะนำเพื่อน' : 'คูปองต้อนรับ',
    heading: isReferrer
      ? '🎁 ขอบคุณที่ชวนเพื่อน'
      : '🎉 ขอบคุณที่เลือกเรา',
    subheading: isReferrer
      ? 'นี่คือคูปองส่วนลดสำหรับการจองครั้งถัดไปของคุณ'
      : 'เก็บโค้ดนี้ไว้ใช้ในการจองครั้งหน้า',
    body,
    cta: { label: 'จองครั้งต่อไป', url: input.ctaUrl },
  })

  return { subject, html }
}
