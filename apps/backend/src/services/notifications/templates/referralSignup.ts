/**
 * ============================================================
 * Referral signup email — sent to the REFERRER
 * ============================================================
 *
 * Fires the moment a referee completes signup with a valid
 * `?ref=CODE`. Goal: tell the referrer "your friend just
 * joined" — re-engaging them at a moment when they're likely
 * to share the code further.
 *
 * Design choices:
 *   - Doesn't promise the reward yet. The referrer earns the
 *     coupon only when the referee actually pays for a booking,
 *     which is a separate event (referralReward template).
 *     Saying "you earned a coupon" here would be misleading.
 *   - Calls out the next step explicitly: "เมื่อเพื่อนจองสำเร็จ
 *     ครั้งแรก ทั้งคู่จะได้คูปอง" — sets expectations cleanly.
 *   - CTA goes to /profile so the referrer can see their funnel
 *     update, share the code again, etc.
 *   - Doesn't reveal the referee's full email — only first
 *     character + domain stub, same as the profile widget.
 * ============================================================
 */

import { wrapEmail, escapeHtml, BRAND } from './layout'

interface ReferralSignupInput {
  /** Display name of the referrer. May be null for older signups. */
  referrerName: string | null
  /**
   * Display name of the referee, if they entered one. Falls back
   * to "เพื่อนคนหนึ่งของคุณ" when null/empty.
   */
  refereeName: string | null
  /** The referrer's profile URL (where they can share the code again). */
  ctaUrl: string
}

export function renderReferralSignupEmail(input: ReferralSignupInput): {
  subject: string
  html: string
} {
  const refereeDisplay = input.refereeName?.trim()
    ? input.refereeName
    : 'เพื่อนคนหนึ่งของคุณ'

  const subject = '🎉 เพื่อนของคุณเพิ่งสมัครสมาชิกแล้ว'

  const greeting = input.referrerName
    ? `สวัสดีคุณ ${escapeHtml(input.referrerName)}`
    : 'สวัสดี'

  const headline = `${escapeHtml(refereeDisplay)} เพิ่งสมัครสมาชิกผ่านลิงก์ของคุณ`

  // Soft expectation-setting: explain WHEN the reward kicks in.
  const expectations = `
    <div style="margin:20px 0;padding:16px;border-radius:12px;background:${BRAND.surface};border:1px solid ${BRAND.border};">
      <div style="color:${BRAND.muted};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">
        ขั้นตอนถัดไป
      </div>
      <div style="color:${BRAND.ink};font-size:14px;line-height:1.65;">
        เมื่อเพื่อนของคุณ <strong>จองและชำระเงินสำเร็จเป็นครั้งแรก</strong>
        คุณทั้งสองคนจะได้รับ <strong>คูปองส่วนลด</strong> สำหรับการจองครั้งถัดไปของคุณเอง
      </div>
    </div>
  `

  const tip = `
    <p style="margin:16px 0 0 0;font-size:14px;color:${BRAND.muted};line-height:1.6;">
      💡 <strong>เทคนิค:</strong> แชร์รหัสของคุณกับเพื่อนคนอื่น ๆ
      เพิ่มเติมได้ — ยิ่งมีเพื่อนมาจอง คุณก็ยิ่งได้คูปองมากขึ้น
    </p>
  `

  const body = `
    <p style="margin:0 0 12px 0;font-size:15px;">${greeting},</p>
    <p style="margin:0;font-size:16px;font-weight:600;color:${BRAND.ink};line-height:1.5;">
      ${headline}
    </p>
    ${expectations}
    ${tip}
  `

  const html = wrapEmail({
    preheader: `${refereeDisplay} เพิ่งสมัครสมาชิกผ่านลิงก์ของคุณ — แชร์ต่อเพื่อรับคูปองเพิ่ม`,
    eyebrow: 'เพื่อนใหม่ของคุณ',
    heading: '🎉 มีคนสมัครผ่านลิงก์คุณ',
    subheading: 'แค่รออีกขั้นตอน — รอเพื่อนจอง คุณก็ได้คูปอง',
    body,
    cta: { label: 'ดูสถานะการแนะนำ', url: input.ctaUrl },
  })

  return { subject, html }
}
