/**
 * ============================================================
 * Reset Password API Route - รีเซ็ตรหัสผ่าน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - POST: รีเซ็ตรหัสผ่านด้วย token
 *
 * Endpoint:
 *   - POST /api/auth/reset-password - รีเซ็ตรหัสผ่าน
 *
 * Request Body:
 *   - token: Reset token จากอีเมล
 *   - password: รหัสผ่านใหม่
 *
 * Features:
 *   - ตรวจสอบ reset token
 *   - Hash รหัสผ่านใหม่
 *   - อัพเดทรหัสผ่านใน database
 *   - Token หมดอายุใน 1 ชั่วโมง
 *
 * Security:
 *   - ตรวจสอบ token ก่อนรีเซ็ตรหัสผ่าน
 *   - Password hashing ด้วย bcrypt
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

/** Library สำหรับ hash password */
import bcrypt from 'bcryptjs'

/** Library สำหรับตรวจสอบ JWT */
import { jwtVerify } from 'jose'

/** ฟังก์ชันตรวจสอบสิทธิ์และ Mock Mode */
import { getJwtSecret, isMockMode } from '../../../../lib/auth'
import { logger } from '../../../../lib/logger'
import { validatePassword } from '../../../../lib/utils'
import { findMockUser } from '../../../../lib/mock-data'
import { rateLimitAsync } from '../../../../middleware/rate-limit'

// ============================================================
// POST Handler - รีเซ็ตรหัสผ่าน
// ============================================================

/**
 * รีเซ็ตรหัสผ่าน
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบ reset token
 *   2. Hash รหัสผ่านใหม่
 *   3. อัพเดทรหัสผ่านใน database (users หรือ admins)
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} สถานะการรีเซ็ตรหัสผ่าน
 *
 * @example
 *   POST /api/auth/reset-password
 *   Body: { "token": "jwt-token-here", "password": "newpassword123" }
 */
export async function POST(request: Request) {
  // ----------------------------------------------------------
  // Rate limit
  // ----------------------------------------------------------
  // The body carries a reset token; without a cap it is brute-forceable.
  const limitResponse = await rateLimitAsync(request, '/api/auth/reset-password')
  if (limitResponse) return limitResponse

  try {
    // ดึงข้อมูลจาก request body
    const body = await request.json()
    const { token, password } = body

    // ----------------------------------------------------------
    // ตรวจสอบข้อมูลที่จำเป็น
    // ----------------------------------------------------------
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Apply the same strong-password rule as /api/auth/register so
    // a reset can't downgrade an account below the registration bar.
    const pwCheck = validatePassword(password, 'th')
    if (!pwCheck.isValid) {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ปลอดภัย', details: pwCheck.errors },
        { status: 400 }
      )
    }

    // ============================================================
    // Mock Mode: verify the token and update the in-memory user so
    // the next login with the new password actually works. Without
    // this, mock-mode testers see "success" then can't log in.
    // ============================================================
    if (isMockMode()) {
      const secret = getJwtSecret()
      let payload: { sub?: string; email?: string; type?: string }
      try {
        const verified = await jwtVerify(token, secret)
        payload = verified.payload as typeof payload
      } catch {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }
      if (payload.type !== 'password_reset') {
        return NextResponse.json(
          { error: 'Invalid token type' },
          { status: 400 }
        )
      }

      const email = payload.email
      if (email) {
        const mockUser = findMockUser(email)
        if (mockUser) {
          mockUser.password_hash = await bcrypt.hash(password, 12)
        }
      }

      return NextResponse.json({
        message: 'Password has been reset successfully.',
      })
    }

    // ============================================================
    // Production Mode: ใช้ Supabase
    // ============================================================
    const secret = getJwtSecret()

    // ----------------------------------------------------------
    // ตรวจสอบและ decode reset token
    // ----------------------------------------------------------
    let payload: any
    try {
      const verified = await jwtVerify(token, secret)
      payload = verified.payload
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่าเป็น reset token หรือไม่
    if (payload.type !== 'password_reset') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 400 }
      )
    }

    const userId = payload.sub as string
    const email = payload.email as string

    // ----------------------------------------------------------
    // Hash รหัสผ่านใหม่
    // ----------------------------------------------------------
    const passwordHash = await bcrypt.hash(password, 12)

    // ----------------------------------------------------------
    // อัพเดทรหัสผ่านใน database
    // ----------------------------------------------------------
    const supabase = await createAdminClient()

    // ตรวจสอบว่าเป็น admin หรือ user
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', userId)
      .single()

    if (admin) {
      // อัพเดทรหัสผ่าน Admin
      const { error } = await supabase
        .from('admins')
        .update({ password_hash: passwordHash })
        .eq('id', userId)

      if (error) {
        logger.error('Error updating admin password', { error })
        return NextResponse.json(
          { error: 'Failed to reset password' },
          { status: 500 }
        )
      }
    } else {
      // อัพเดทรหัสผ่าน User
      const { error } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', userId)

      if (error) {
        logger.error('Error updating user password', { error })
        return NextResponse.json(
          { error: 'Failed to reset password' },
          { status: 500 }
        )
      }
    }

    // ----------------------------------------------------------
    // Return Success
    // ----------------------------------------------------------
    return NextResponse.json({
      message: 'Password has been reset successfully.',
    })
  } catch (error) {
    logger.error('Reset password error', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
