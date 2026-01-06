/**
 * ============================================================
 * Auth Me API Route - ดึงข้อมูลผู้ใช้ปัจจุบัน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ดึงข้อมูลของผู้ใช้ที่ login อยู่
 *   - ตรวจสอบ JWT token จาก cookie
 *
 * Endpoint:
 *   - GET /api/auth/me - ดึงข้อมูลผู้ใช้ปัจจุบัน
 *
 * Response (Success):
 *   - user: ข้อมูลผู้ใช้ (id, email, name, ...)
 *
 * Response (Not Logged In):
 *   - error: "ไม่ได้เข้าสู่ระบบ"
 *   - status: 401
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันตรวจสอบ token ของ User */
import { verifyUserToken } from '../../../../lib/auth'

// ============================================================
// GET Handler - ดึงข้อมูลผู้ใช้ปัจจุบัน
// ============================================================

/**
 * ดึงข้อมูลผู้ใช้ที่ login อยู่
 *
 * @description
 *   ตรวจสอบ user_token จาก cookie และ decode JWT
 *   เพื่อดึงข้อมูลผู้ใช้ที่ login อยู่
 *
 * @returns {Promise<NextResponse>} ข้อมูลผู้ใช้ หรือ error 401
 *
 * @example
 *   GET /api/auth/me
 *   Headers: { "Cookie": "user_token=xxx" }
 *
 *   Response: {
 *     "user": {
 *       "id": "user-123",
 *       "email": "user@example.com",
 *       "name": "สมชาย ใจดี"
 *     }
 *   }
 */
export async function GET() {
  try {
    // ----------------------------------------------------------
    // ตรวจสอบ token และดึงข้อมูลผู้ใช้
    // ----------------------------------------------------------
    const auth = await verifyUserToken()

    // ถ้าไม่ได้ login
    if (!auth.success) {
      return NextResponse.json(
        { error: 'ไม่ได้เข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // ส่งกลับข้อมูลผู้ใช้
    return NextResponse.json({
      user: auth.user,
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
