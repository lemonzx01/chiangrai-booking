/**
 * ============================================================
 * Payments API Route - จัดการข้อมูลการชำระเงิน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงรายการการชำระเงินทั้งหมด (เฉพาะ Admin)
 *
 * Endpoints:
 *   - GET  /api/payments - ดึงรายการการชำระเงิน (รองรับ pagination และ filter)
 *
 * Query Parameters (GET):
 *   - limit: จำนวนรายการต่อหน้า (default: 20)
 *   - offset: ตำแหน่งเริ่มต้น (default: 0)
 *   - status: กรองตามสถานะการชำระเงิน (PENDING, SUCCEEDED, FAILED, REFUNDED)
 *   - start_date: วันที่เริ่มต้น (YYYY-MM-DD)
 *   - end_date: วันที่สิ้นสุด (YYYY-MM-DD)
 *   - booking_id: กรองตาม booking ID
 *
 * Features:
 *   - รองรับ pagination
 *   - รองรับการกรองตามสถานะและวันที่
 *   - JOIN กับข้อมูลการจอง
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันตรวจสอบสิทธิ์ */
import { verifyAdminToken, unauthorizedResponse } from '../../../lib/auth'

/** Security utilities */
import { rateLimitAsync } from '../../../middleware/rate-limit'
import { addSecurityHeaders } from '../../../lib/security'
import { logger } from '../../../lib/logger'

// ============================================================
// Route Configuration
// ============================================================
export const dynamic = 'force-dynamic'

// ============================================================
// GET Handler - ดึงรายการการชำระเงิน
// ============================================================

/**
 * ดึงรายการการชำระเงินทั้งหมด (สำหรับ Admin)
 *
 * @description
 *   - ดึงข้อมูลการชำระเงินพร้อมข้อมูลการจองที่เกี่ยวข้อง
 *   - รองรับ pagination ด้วย limit และ offset
 *   - รองรับการกรองตามสถานะ (status), วันที่, และ booking_id
 *   - เรียงตามวันที่สร้างล่าสุดก่อน
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} รายการการชำระเงินพร้อมข้อมูล pagination
 *
 * @example
 *   // ดึงการชำระเงิน 20 รายการแรก
 *   GET /api/payments
 *
 *   // กรองเฉพาะการชำระเงินที่สำเร็จ
 *   GET /api/payments?status=SUCCEEDED
 *
 *   // กรองตามช่วงวันที่
 *   GET /api/payments?start_date=2024-01-01&end_date=2024-01-31
 */
export async function GET(request: Request) {
  try {
    // ----------------------------------------------------------
    // Rate Limiting
    // ----------------------------------------------------------
    const rateLimitResponse = await rateLimitAsync(request, '/api/payments')
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse)
    }

    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ Admin
    // ----------------------------------------------------------
    const auth = await verifyAdminToken()
    if (!auth.success) {
      const response = unauthorizedResponse('Admin access required')
      return addSecurityHeaders(response)
    }

    // สร้าง Supabase Admin client (ข้าม RLS)
    const supabase = await createAdminClient()

    // ดึง query parameters จาก URL
    const { searchParams } = new URL(request.url)

    // ----------------------------------------------------------
    // ตั้งค่า Pagination
    // ----------------------------------------------------------
    /** จำนวนรายการต่อหน้า (default: 20) */
    const limit = parseInt(searchParams.get('limit') || '20')

    /** ตำแหน่งเริ่มต้น (default: 0) */
    const offset = parseInt(searchParams.get('offset') || '0')

    /** ตัวกรองสถานะ (optional) */
    const status = searchParams.get('status')

    /** ตัวกรองวันที่เริ่มต้น (optional) */
    const startDate = searchParams.get('start_date')

    /** ตัวกรองวันที่สิ้นสุด (optional) */
    const endDate = searchParams.get('end_date')

    /** ตัวกรอง booking ID (optional) */
    const bookingId = searchParams.get('booking_id')

    // ----------------------------------------------------------
    // สร้าง Query พร้อม JOIN กับตาราง bookings
    // ----------------------------------------------------------
    let query = supabase
      .from('payments')
      .select(
        '*, booking:bookings(*, hotel:hotels(*), car:cars(*))',
        { count: 'exact' }
      ) // JOIN ข้อมูลการจอง
      .order('created_at', { ascending: false }) // เรียงจากใหม่ไปเก่า

    // เพิ่มตัวกรองสถานะ (ถ้ามี)
    if (status) {
      // Cast status เป็น PaymentStatusEnum เพื่อให้ type ถูกต้อง
      query = query.eq('status', status as 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED')
    }

    // เพิ่มตัวกรอง booking ID (ถ้ามี)
    if (bookingId) {
      query = query.eq('booking_id', bookingId)
    }

    // เพิ่มตัวกรองวันที่ (ถ้ามี)
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59.999Z`)
    }

    // ----------------------------------------------------------
    // ดึงข้อมูลพร้อม Pagination
    // ----------------------------------------------------------
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    // ตรวจสอบ Error
    if (error) {
      logger.error('Error fetching payments', { error })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ส่งกลับข้อมูลพร้อม pagination info
    const response = NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
    return addSecurityHeaders(response)
  } catch (error) {
    logger.error('Payments API error', { error })
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addSecurityHeaders(response)
  }
}
