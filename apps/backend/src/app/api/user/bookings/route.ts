/**
 * ============================================================
 * User Bookings API Route - ดึงการจองของผู้ใช้
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ดึงรายการการจองของผู้ใช้ที่ login อยู่
 *   - กรองตาม email ของผู้ใช้
 *   - รองรับ Mock Mode สำหรับการทดสอบ
 *
 * Endpoint:
 *   - GET /api/user/bookings - ดึงการจองของผู้ใช้ปัจจุบัน
 *
 * Authentication:
 *   - ต้อง login ก่อนจึงจะใช้งานได้
 *   - ใช้ JWT token จาก cookie เพื่อระบุตัวผู้ใช้
 *
 * Response:
 *   - data: รายการการจองพร้อมข้อมูลโรงแรม/รถเช่า
 *   - total: จำนวนการจองทั้งหมด
 *
 * ============================================================
 */
export const dynamic = 'force-dynamic'


// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase client สำหรับ Server-side */
import { createAdminClient } from '../../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันตรวจสอบสิทธิ์ */
import { verifyUserToken, isMockMode } from '../../../../lib/auth'

/** ข้อมูล Mock สำหรับการทดสอบ */
import { getMockBookingsByEmail } from '../../../../lib/mock-data'
import { logger } from '../../../../lib/logger'

// ============================================================
// GET Handler - ดึงการจองของผู้ใช้
// ============================================================

/**
 * ดึงรายการการจองของผู้ใช้ที่ login อยู่
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบว่าผู้ใช้ login หรือยัง
 *   2. ดึง email ของผู้ใช้จาก token
 *   3. Mock Mode: ดึงจากข้อมูลจำลอง
 *   4. Production Mode: ดึงจาก Supabase
 *   5. ส่งกลับรายการการจองพร้อมข้อมูลที่เกี่ยวข้อง
 *
 * @returns {Promise<NextResponse>} รายการการจองของผู้ใช้
 *
 * @example
 *   GET /api/user/bookings
 *   Headers: { "Cookie": "auth-token=xxx" }
 *
 *   Response: {
 *     "data": [
 *       { "booking_code": "BK-ABC123", "hotel": {...}, ... },
 *       ...
 *     ],
 *     "total": 5
 *   }
 */
export async function GET() {
  try {
    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ผู้ใช้
    // ----------------------------------------------------------
    const auth = await verifyUserToken()

    // ตรวจสอบว่า login หรือยัง
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // ----------------------------------------------------------
    // Mock Mode: ดึงจากข้อมูลจำลอง
    // ----------------------------------------------------------
    if (isMockMode()) {
      /** การจองที่ตรงกับ email ของผู้ใช้ */
      const bookings = getMockBookingsByEmail(auth.user.email)
      return NextResponse.json({
        data: bookings,
        total: bookings.length,
      })
    }

    // ----------------------------------------------------------
    // Production Mode: ดึงจาก Supabase
    // ----------------------------------------------------------
    const supabase = await createAdminClient()

    const { data: bookings, error, count } = await supabase
      .from('bookings')
      .select(`
        *,
        hotel:hotels(*),
        car:cars(*)
      `, { count: 'exact' }) // นับจำนวนทั้งหมดด้วย
      .eq('customer_email', auth.user.email) // กรองตาม email ผู้ใช้
      .order('created_at', { ascending: false }) // เรียงจากใหม่ไปเก่า

    // ตรวจสอบ Error
    if (error) {
      logger.error('Get bookings error', { error })
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลการจองได้' },
        { status: 500 }
      )
    }

    // ----------------------------------------------------------
    // ส่งกลับข้อมูลการจอง
    // ----------------------------------------------------------
    return NextResponse.json({
      data: bookings,
      total: count,
    })
  } catch (error) {
    logger.error('Get bookings error (outer)', { error })
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
