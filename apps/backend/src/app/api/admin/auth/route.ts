/**
 * ============================================================
 * Admin Auth API Route - ตรวจสอบสถานะ Admin และออกจากระบบ
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ตรวจสอบสถานะ login ของ Admin
 *   - DELETE: ออกจากระบบ Admin
 *
 * Endpoints:
 *   - GET    /api/admin/auth - ตรวจสอบสถานะ Admin
 *   - DELETE /api/admin/auth - ออกจากระบบ Admin
 *
 * GET Response:
 *   - user: ข้อมูล Admin (ถ้า login อยู่) หรือ null
 *
 * Note:
 *   - GET ไม่ return error 401 แต่จะ return { user: null }
 *   - เพื่อให้ frontend สามารถตรวจสอบสถานะได้โดยไม่ต้อง handle error
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Next.js Response utility */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

/** ฟังก์ชันจัดการ cookies */
import { cookies } from 'next/headers'

/** ฟังก์ชันตรวจสอบ JWT */
import { jwtVerify } from 'jose'

/** ฟังก์ชันดึง JWT Secret */
import { getJwtSecret } from '@/lib/auth'

// ============================================================
// GET Handler - ตรวจสอบสถานะ Admin
// ============================================================

/**
 * ตรวจสอบสถานะ login ของ Admin
 *
 * @description
 *   ตรวจสอบ admin_token จาก cookie และ decode JWT
 *   เพื่อดึงข้อมูล Admin ที่ login อยู่
 *
 *   ไม่ return error 401 แต่จะ return { user: null }
 *   เพื่อให้ frontend ใช้งานได้ง่าย
 *
 * @returns {Promise<NextResponse>} ข้อมูล Admin หรือ null
 *
 * @example
 *   GET /api/admin/auth
 *
 *   // ถ้า login อยู่
 *   Response: {
 *     "user": {
 *       "id": "admin-1",
 *       "email": "admin@example.com",
 *       "name": "Admin",
 *       "role": "admin"
 *     }
 *   }
 *
 *   // ถ้าไม่ได้ login
 *   Response: { "user": null }
 */
export async function GET() {
  try {
    // ดึง admin_token จาก cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    // ถ้าไม่มี token = ไม่ได้ login
    if (!token) {
      return NextResponse.json({ user: null })
    }

    try {
      // ----------------------------------------------------------
      // ตรวจสอบและ decode JWT
      // ----------------------------------------------------------
      const { payload } = await jwtVerify(token, getJwtSecret())

      // ส่งกลับข้อมูล Admin
      return NextResponse.json({
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
      })
    } catch {
      // Token ไม่ถูกต้อง หรือหมดอายุ
      return NextResponse.json({ user: null })
    }
  } catch {
    // Error อื่นๆ
    return NextResponse.json({ user: null })
  }
}

// ============================================================
// DELETE Handler - ออกจากระบบ Admin
// ============================================================

/**
 * ออกจากระบบ Admin
 *
 * @description
 *   ลบ admin_token cookie เพื่อออกจากระบบ
 *
 * @returns {Promise<NextResponse>} สถานะความสำเร็จ
 *
 * @example
 *   DELETE /api/admin/auth
 *   Response: { "success": true }
 */
export async function DELETE() {
  // ลบ admin_token cookie
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')

  return NextResponse.json({ success: true })
}
