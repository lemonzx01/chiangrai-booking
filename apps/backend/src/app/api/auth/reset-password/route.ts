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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/reset-password/route.ts:POST',message:'Reset password called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  try {
    // ดึงข้อมูลจาก request body
    const body = await request.json()
    const { token, password } = body
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/reset-password/route.ts:POST',message:'Reset password data',data:{hasToken:!!token,tokenLength:token?.length || 0,hasPassword:!!password,passwordLength:password?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // ----------------------------------------------------------
    // ตรวจสอบข้อมูลที่จำเป็น
    // ----------------------------------------------------------
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // ตรวจสอบความยาวรหัสผ่าน
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // ============================================================
    // Mock Mode: ใช้ข้อมูลจำลอง
    // ============================================================
    if (isMockMode()) {
      // ใน Mock Mode เราจะ return success เสมอ
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
        console.error('Error updating admin password:', error)
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
        console.error('Error updating user password:', error)
        return NextResponse.json(
          { error: 'Failed to reset password' },
          { status: 500 }
        )
      }
    }

    // ----------------------------------------------------------
    // Return Success
    // ----------------------------------------------------------
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/reset-password/route.ts:POST',message:'Reset password success',data:{hasAdmin:!!admin,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({
      message: 'Password has been reset successfully.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
