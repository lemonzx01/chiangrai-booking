/**
 * ============================================================
 * Dashboard Stats API Route - สถิติ Dashboard สำหรับ Admin
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงสถิติรวมของระบบ (สำหรับ Admin Dashboard)
 *
 * Endpoints:
 *   - GET  /api/dashboard/stats - ดึงสถิติ Dashboard
 *
 * Features:
 *   - จำนวนโรงแรม/แพ็คเกจทั้งหมด
 *   - จำนวนรถเช่าทั้งหมด
 *   - จำนวนการจองทั้งหมด
 *   - รายได้รวม
 *   - จำนวนการจองที่รอดำเนินการ
 *   - จำนวนการจองที่ยืนยันแล้ว
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

/** Type definitions */
import { DashboardStats } from '@chiangrai/shared/types'

/** Mock data สำหรับ fallback */
import { isMockMode } from '../../../../lib/auth'

// ============================================================
// Route Configuration
// ============================================================
export const dynamic = 'force-dynamic'

// ============================================================
// GET Handler - ดึงสถิติ Dashboard
// ============================================================

/**
 * ดึงสถิติ Dashboard (สำหรับ Admin)
 *
 * @description
 *   - นับจำนวน hotels, cars, bookings
 *   - คำนวณรายได้รวมจาก payments
 *   - นับจำนวน pending และ confirmed bookings
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} สถิติ Dashboard
 *
 * @example
 *   GET /api/dashboard/stats
 *   Response: {
 *     "data": {
 *       "totalHotels": 10,
 *       "totalCars": 5,
 *       "totalBookings": 50,
 *       "totalRevenue": 500000,
 *       "pendingBookings": 5,
 *       "confirmedBookings": 45
 *     }
 *   }
 */
export async function GET(request: Request) {
  try {
    // ----------------------------------------------------------
    // Rate Limiting
    // ----------------------------------------------------------
    const rateLimitResponse = rateLimitMiddleware(request, '/api/dashboard')
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

    // ============================================================
    // Mock Mode: ใช้ข้อมูลจำลอง
    // ============================================================
    if (isMockMode()) {
      const mockStats: DashboardStats = {
        totalHotels: 8,
        totalCars: 6,
        totalBookings: 24,
        totalRevenue: 125000,
        pendingBookings: 3,
        confirmedBookings: 21,
      }

      const response = NextResponse.json({ data: mockStats })
      return addSecurityHeaders(response)
    }

    // ============================================================
    // Production Mode: ใช้ Supabase
    // ============================================================
    const supabase = await createAdminClient()

    // ----------------------------------------------------------
    // นับจำนวน Hotels
    // ----------------------------------------------------------
    const { count: hotelsCount, error: hotelsError } = await supabase
      .from('hotels')
      .select('*', { count: 'exact', head: true })

    if (hotelsError) {
      console.error('Error counting hotels:', hotelsError)
    }

    // ----------------------------------------------------------
    // นับจำนวน Cars
    // ----------------------------------------------------------
    const { count: carsCount, error: carsError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })

    if (carsError) {
      console.error('Error counting cars:', carsError)
    }

    // ----------------------------------------------------------
    // นับจำนวน Bookings และสถานะ
    // ----------------------------------------------------------
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('status')

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }

    const bookingsList = bookings || []
    const totalBookings = bookingsList.length
    const pendingBookings = bookingsList.filter((b) => b.status === 'PENDING').length
    const confirmedBookings = bookingsList.filter(
      (b) => b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'COMPLETED'
    ).length

    // ----------------------------------------------------------
    // คำนวณรายได้รวมจาก Payments
    // ----------------------------------------------------------
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, status')

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
    }

    const paymentsList = payments || []
    const totalRevenue = paymentsList
      .filter((p) => p.status === 'SUCCEEDED')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)

    // ----------------------------------------------------------
    // สร้าง Response
    // ----------------------------------------------------------
    const stats: DashboardStats = {
      totalHotels: hotelsCount || 0,
      totalCars: carsCount || 0,
      totalBookings,
      totalRevenue,
      pendingBookings,
      confirmedBookings,
    }

    const response = NextResponse.json({ data: stats })
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Dashboard stats API error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addSecurityHeaders(response)
  }
}
