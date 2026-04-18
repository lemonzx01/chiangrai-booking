/**
 * Email template — password reset request.
 */
import { escapeHtml, wrapEmail } from './layout'

export interface PasswordResetTemplateData {
  userName: string
  resetLink: string
  expiresInMinutes?: number
}

export function renderPasswordResetEmail(data: PasswordResetTemplateData) {
  const subject = 'รีเซ็ตรหัสผ่าน - Got Journey Thailand'
  const safeLink = escapeHtml(data.resetLink)
  const minutes = data.expiresInMinutes ?? 60
  const html = wrapEmail({
    heading: 'รีเซ็ตรหัสผ่าน',
    body: `
      <p>สวัสดีคุณ ${escapeHtml(data.userName)},</p>
      <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ</p>
      <p>กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${safeLink}" style="display:inline-block;padding:12px 24px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
          รีเซ็ตรหัสผ่าน
        </a>
      </div>
      <p style="color:#6B7280;font-size:14px;">ลิงก์นี้จะหมดอายุใน ${minutes} นาที</p>
      <p style="color:#6B7280;font-size:13px;">หากปุ่มไม่ทำงาน ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
      <p style="word-break:break-all;color:#4F46E5;font-size:13px;">${safeLink}</p>
    `,
    footerNote: 'หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน สามารถเพิกเฉยต่ออีเมลนี้ได้',
  })
  return { subject, html }
}
