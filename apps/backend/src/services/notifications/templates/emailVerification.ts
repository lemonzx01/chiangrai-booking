/**
 * Email template — verify email address (register / resend).
 */
import { escapeHtml, wrapEmail } from './layout'

export interface EmailVerificationTemplateData {
  userName: string
  verifyLink: string
}

export function renderEmailVerificationEmail(data: EmailVerificationTemplateData) {
  const subject = 'ยืนยันอีเมล - Got Journey Thailand'
  const safeLink = escapeHtml(data.verifyLink)
  const html = wrapEmail({
    heading: 'ยืนยันอีเมลของคุณ',
    body: `
      <p>สวัสดีคุณ ${escapeHtml(data.userName)},</p>
      <p>ขอบคุณที่สมัครสมาชิก กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${safeLink}" style="display:inline-block;padding:12px 24px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
          ยืนยันอีเมล
        </a>
      </div>
      <p style="color:#6B7280;font-size:14px;">ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง</p>
      <p style="color:#6B7280;font-size:13px;">หากปุ่มไม่ทำงาน ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
      <p style="word-break:break-all;color:#4F46E5;font-size:13px;">${safeLink}</p>
    `,
    footerNote: 'หากคุณไม่ได้สมัครสมาชิก สามารถเพิกเฉยต่ออีเมลนี้ได้',
  })
  return { subject, html }
}
