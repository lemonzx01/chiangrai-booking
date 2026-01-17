/**
 * ============================================================
 * Validate Reset Token API Route - ตรวจสอบ reset token
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ตรวจสอบว่า reset token ถูกต้องและยังไม่หมดอายุ
 *
 * Endpoint:
 *   - GET /api/auth/validate-reset-token?token=xxx - ตรวจสอบ token
 *
 * Query Parameters:
 *   - token: Reset token จากอีเมล
 *
 * Response:
 *   - 200: Token ถูกต้อง
 *   - 400: Token ไม่ถูกต้องหรือหมดอายุ
 *
 * Security:
 *   - ตรวจสอบ token signature และ expiration
 *   - ไม่เปิดเผยข้อมูลผู้ใช้
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** Library สำหรับตรวจสอบ JWT */
import { jwtVerify } from 'jose'

/** ฟังก์ชันตรวจสอบสิทธิ์และ Mock Mode */
import { getJwtSecret, isMockMode } from '../../../../lib/auth'

// ============================================================
// GET Handler - ตรวจสอบ reset token
// ============================================================

/**
 * ตรวจสอบ reset token
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบ reset token signature
 *   2. ตรวจสอบว่า token ยังไม่หมดอายุ
 *   3. ตรวจสอบว่าเป็น reset token หรือไม่
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} สถานะการตรวจสอบ token
 *
 * @example
 *   GET /api/auth/validate-reset-token?token=jwt-token-here
 */
export async function GET(request: Request) {
  try {
    // ดึง token จาก query parameters
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    // ----------------------------------------------------------
    // ตรวจสอบข้อมูลที่จำเป็น
    // ----------------------------------------------------------
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required', valid: false },
        { status: 400 }
      )
    }

    // ============================================================
    // Mock Mode: ใช้ข้อมูลจำลอง
    // ============================================================
    if (isMockMode()) {
      // ใน Mock Mode เราจะ return valid เสมอ
      return NextResponse.json({
        valid: true,
        message: 'Token is valid',
      })
    }

    // ============================================================
    // Production Mode: ตรวจสอบ token
    // ============================================================
    const secret = getJwtSecret()

    // ----------------------------------------------------------
    // ตรวจสอบและ decode reset token
    // ----------------------------------------------------------
    try {
      const verified = await jwtVerify(token, secret)
      const payload = verified.payload

      // ตรวจสอบว่าเป็น reset token หรือไม่
      if (payload.type !== 'password_reset') {
        return NextResponse.json(
          { error: 'Invalid token type', valid: false },
          { status: 400 }
        )
      }

      // Token ถูกต้อง
      return NextResponse.json({
        valid: true,
        message: 'Token is valid',
      })
    } catch (error: any) {
      // Token ไม่ถูกต้องหรือหมดอายุ
      return NextResponse.json(
        { 
          error: 'Invalid or expired reset token',
          valid: false,
          details: error?.message || 'Token verification failed'
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Validate reset token error:', error)
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    )
  }
}
