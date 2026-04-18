/**
 * ============================================================
 * Payments Stats API Route - สถิติการชำระเงิน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงสถิติการชำระเงิน (สำหรับ Admin)
 *
 * Endpoints:
 *   - GET  /api/payments/stats - ดึงสถิติการชำระเงิน
 *
 * Query Parameters (GET):
 *   - start_date: วันที่เริ่มต้น (YYYY-MM-DD)
 *   - end_date: วันที่สิ้นสุด (YYYY-MM-DD)
 *
 * Features:
 *   - ยอดรวมรายได้
 *   - จำนวนการชำระเงินที่สำเร็จ
 *   - จำนวนการชำระเงินที่ล้มเหลว
 *   - อัตราความสำเร็จ
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

/** ฟังก์ชันตรวจสอบสิทธิ์ */
import { verifyAdminToken, unauthorizedResponse } from '../../../../lib/auth'

/** Security utilities */
import { rateLimitMiddleware } from '../../../../middleware/rate-limit'
import { addSecurityHeaders } from '../../../../lib/security'
import { logger } from '../../../../lib/logger'

// ============================================================
// Route Configuration
// ============================================================
export const dynamic = 'force-dynamic'

// ============================================================
// GET Handler - ดึงสถิติการชำระเงิน
// ============================================================

/**
 * ดึงสถิติการชำระเงิน (สำหรับ Admin)
 *
 * @description
 *   - คำนวณยอดรวมรายได้จาก payment ที่สำเร็จ
 *   - นับจำนวน payment ตามสถานะ
 *   - คำนวณอัตราความสำเร็จ
 *   - รองรับการกรองตามช่วงวันที่
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} สถิติการชำระเงิน
 *
 * @example
 *   // ดึงสถิติทั้งหมด
 *   GET /api/payments/stats
 *
 *   // ดึงสถิติตามช่วงวันที่
 *   GET /api/payments/stats?start_date=2024-01-01&end_date=2024-01-31
 */
export async function GET(request: Request) {
  try {
    // ----------------------------------------------------------
    // Rate Limiting
    // ----------------------------------------------------------
    const rateLimitResponse = rateLimitMiddleware(request, '/api/payments')
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

    /** ตัวกรองวันที่เริ่มต้น (optional) */
    const startDate = searchParams.get('start_date')

    /** ตัวกรองวันที่สิ้นสุด (optional) */
    const endDate = searchParams.get('end_date')

    // ----------------------------------------------------------
    // สร้าง Query พื้นฐาน
    // ----------------------------------------------------------
    let query = supabase.from('payments').select('status, amount, currency')

    // เพิ่มตัวกรองวันที่ (ถ้ามี)
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59.999Z`)
    }

    // ----------------------------------------------------------
    // ดึงข้อมูลทั้งหมด
    // ----------------------------------------------------------
    const { data, error } = await query

    // ตรวจสอบ Error
    if (error) {
      logger.error('Error fetching payment stats', { error })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ----------------------------------------------------------
    // คำนวณสถิติ
    // ----------------------------------------------------------
    const payments = data || []

    /** ยอดรวมรายได้ (เฉพาะ payment ที่สำเร็จ) */
    const totalRevenue = payments
      .filter((p: any) => p.status === 'SUCCEEDED')
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount.toString()), 0)

    /** จำนวน payment ที่สำเร็จ */
    const succeededCount = payments.filter((p: any) => p.status === 'SUCCEEDED').length

    /** จำนวน payment ที่ล้มเหลว */
    const failedCount = payments.filter((p: any) => p.status === 'FAILED').length

    /** จำนวน payment ที่รอดำเนินการ */
    const pendingCount = payments.filter((p: any) => p.status === 'PENDING').length

    /** จำนวน payment ที่คืนเงินแล้ว */
    const refundedCount = payments.filter((p: any) => p.status === 'REFUNDED').length

    /** จำนวน payment ทั้งหมด */
    const totalCount = payments.length

    /** อัตราความสำเร็จ (เปอร์เซ็นต์) */
    const successRate =
      totalCount > 0 ? ((succeededCount / totalCount) * 100).toFixed(2) : '0.00'

    // ส่งกลับสถิติ
    const response = NextResponse.json({
      totalRevenue,
      totalCount,
      succeededCount,
      failedCount,
      pendingCount,
      refundedCount,
      successRate: parseFloat(successRate),
      currency: 'THB', // Default currency (สามารถปรับให้รองรับหลายสกุลเงินได้)
    })
    return addSecurityHeaders(response)
  } catch (error) {
    logger.error('Payment stats API error', { error })
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addSecurityHeaders(response)
  }
}
