/**
 * ============================================================
 * Forgot Password API Route - ขอรีเซ็ตรหัสผ่าน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - POST: ส่งอีเมลลิงก์รีเซ็ตรหัสผ่าน
 *
 * Endpoint:
 *   - POST /api/auth/forgot-password - ขอรีเซ็ตรหัสผ่าน
 *
 * Request Body:
 *   - email: อีเมลผู้ใช้
 *
 * Features:
 *   - ตรวจสอบว่ามีอีเมลในระบบ
 *   - สร้าง reset token
 *   - ส่งอีเมลลิงก์รีเซ็ตรหัสผ่าน
 *   - เก็บ reset token ใน database (ถ้ามีตาราง password_resets)
 *
 * Security:
 *   - ไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่ (เพื่อความปลอดภัย)
 *   - Reset token หมดอายุใน 1 ชั่วโมง
 *
 * ============================================================
 */
export const dynamic = 'force-dynamic'


// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '../../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** Library สำหรับสร้าง JWT */
import { SignJWT } from 'jose'

/** ฟังก์ชันตรวจสอบสิทธิ์และ Mock Mode */
import { getJwtSecret, isMockMode } from '../../../../lib/auth'

/** บริการส่งอีเมล */
import { sendEmail } from '../../../../services/notifications/email'

/** ข้อมูล Mock */
import { findMockUser, findMockAdmin } from '../../../../lib/mock-data'

/** Rate limiting middleware */
import { rateLimitMiddleware } from '../../../../middleware/rate-limit'

// ============================================================
// POST Handler - ขอรีเซ็ตรหัสผ่าน
// ============================================================

/**
 * ขอรีเซ็ตรหัสผ่าน
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบว่ามีอีเมลในระบบ (users หรือ admins)
 *   2. สร้าง reset token
 *   3. ส่งอีเมลลิงก์รีเซ็ตรหัสผ่าน
 *   4. ไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่ (เพื่อความปลอดภัย)
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} สถานะการส่งอีเมล
 *
 * @example
 *   POST /api/auth/forgot-password
 *   Body: { "email": "user@example.com" }
 */
export async function POST(request: Request) {
  try {
    // ----------------------------------------------------------
    // Rate Limiting - ป้องกัน spam
    // ----------------------------------------------------------
    const rateLimitResponse = rateLimitMiddleware(request, '/api/auth/forgot-password')
    if (rateLimitResponse) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResponse.headers.get('Retry-After') || '3600',
          }
        }
      )
    }

    // ดึงข้อมูลจาก request body
    const body = await request.json()
    const { email } = body

    // ----------------------------------------------------------
    // ตรวจสอบข้อมูลที่จำเป็น
    // ----------------------------------------------------------
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // ตรวจสอบ email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // ============================================================
    // Mock Mode: ใช้ข้อมูลจำลอง
    // ============================================================
    if (isMockMode()) {
      // ตรวจสอบว่ามี user หรือ admin ในระบบหรือไม่
      const mockUser = findMockUser(email)
      const mockAdmin = findMockAdmin(email)

      // ไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่ (เพื่อความปลอดภัย)
      // แต่ใน Mock Mode เราจะแสดงข้อความสำเร็จเสมอ
      return NextResponse.json({
        message: 'If the email exists, a password reset link has been sent.',
      })
    }

    // ============================================================
    // Production Mode: ใช้ Supabase
    // ============================================================
    const supabase = await createAdminClient()

    // ----------------------------------------------------------
    // ตรวจสอบว่ามีอีเมลในระบบหรือไม่
    // ----------------------------------------------------------
    // ตรวจสอบใน users table
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    // ตรวจสอบใน admins table
    const { data: admin } = await supabase
      .from('admins')
      .select('id, email, name')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    // ถ้าไม่มีอีเมลในระบบ ให้ return success เหมือนกัน (เพื่อความปลอดภัย)
    if (!user && !admin) {
      // ไม่เปิดเผยว่าอีเมลไม่มีในระบบ
      return NextResponse.json({
        message: 'If the email exists, a password reset link has been sent.',
      })
    }

    // ----------------------------------------------------------
    // สร้าง Reset Token
    // ----------------------------------------------------------
    const secret = getJwtSecret()
    const resetToken = await new SignJWT({
      sub: user?.id || admin?.id,
      email: email,
      type: 'password_reset',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h') // หมดอายุใน 1 ชั่วโมง
      .setIssuedAt()
      .sign(secret)

    // ----------------------------------------------------------
    // สร้าง Reset Link
    // ----------------------------------------------------------
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    // ----------------------------------------------------------
    // ส่งอีเมลรีเซ็ตรหัสผ่าน
    // ----------------------------------------------------------
    const userName = user?.name || admin?.name || 'User'
    
    try {
      const emailResult = await sendEmail({
        to: email,
        subject: 'รีเซ็ตรหัสผ่าน - Got Journey Thailand',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">รีเซ็ตรหัสผ่าน</h1>
            <p>สวัสดีคุณ ${userName},</p>
            <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ</p>
            <p>กรุณาคลิกลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                รีเซ็ตรหัสผ่าน
              </a>
            </div>
            <p style="color: #6B7280; font-size: 14px;">
              หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br>
              <a href="${resetLink}" style="color: #4F46E5; word-break: break-all;">${resetLink}</a>
            </p>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง<br>
              ถ้าคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้
            </p>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              นี่เป็นอีเมลอัตโนมัติ กรุณาอย่าตอบกลับ
            </p>
          </div>
        `,
      })

      // ตรวจสอบผลการส่งอีเมล
      if (!emailResult) {
        console.error('[ERROR] Failed to send password reset email:', {
          email,
          reason: 'Email service returned null (RESEND_API_KEY may not be set)',
        })
        // ยังคง return success เพื่อความปลอดภัย (ไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่)
        // แต่ log error เพื่อให้ admin รู้
      } else {
        console.log('[INFO] Password reset email sent successfully:', {
          email,
          emailId: (emailResult as any)?.id || 'unknown',
        })
      }
    } catch (emailError: any) {
      console.error('[ERROR] Exception while sending password reset email:', {
        email,
        error: emailError?.message || String(emailError),
        stack: emailError?.stack,
      })
      // ยังคง return success เพื่อความปลอดภัย
      // แต่ log error เพื่อให้ admin รู้
    }

    // ----------------------------------------------------------
    // Return Success (ไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่)
    // ----------------------------------------------------------
    // หมายเหตุ: เรายังคง return success แม้ว่าอีเมลจะส่งไม่สำเร็จ
    // เพื่อความปลอดภัย (ไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่)
    // แต่ error จะถูก log ไว้ใน server logs
    return NextResponse.json({
      message: 'If the email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
