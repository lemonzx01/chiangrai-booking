/**
 * ============================================================
 * Auth Logout API Route - ออกจากระบบสำหรับ User
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ออกจากระบบสำหรับ User ทั่วไป
 *   - ลบ user_token cookie
 *
 * Endpoint:
 *   - POST /api/auth/logout - ออกจากระบบ
 *
 * Response:
 *   - message: ข้อความยืนยันการออกจากระบบ
 *
 * Note:
 *   - สำหรับ Admin ให้ใช้ DELETE /api/admin/auth แทน
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

// ============================================================
// POST Handler - ออกจากระบบ
// ============================================================

/**
 * ออกจากระบบสำหรับ User
 *
 * @description
 *   ลบ user_token cookie เพื่อออกจากระบบ
 *   JWT token จะไม่สามารถใช้งานได้อีก (ยกเว้นจะมีการเรียก API ตรงโดยไม่ผ่าน cookie)
 *
 * @returns {Promise<NextResponse>} ข้อความยืนยันการออกจากระบบ
 *
 * @example
 *   POST /api/auth/logout
 *   Response: { "message": "ออกจากระบบสำเร็จ" }
 */
export async function POST() {
  try {
    // ดึง cookie store
    const cookieStore = await cookies()

    // ----------------------------------------------------------
    // ลบ user_token cookie
    // ----------------------------------------------------------
    cookieStore.delete('user_token')

    return NextResponse.json({ message: 'ออกจากระบบสำเร็จ' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
