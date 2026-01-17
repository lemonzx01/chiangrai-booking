/**
 * ============================================================
 * Admin Bookings Page - หน้าจัดการการจอง (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการการจองทั้งหมด
 *   - อนุญาตให้ Admin เปลี่ยนสถานะการจอง
 *
 * Route:
 *   - /admin/bookings - หน้ารายการการจอง
 *
 * Features:
 *   - ตารางแสดงรายการการจอง
 *   - ข้อมูลลูกค้า (ชื่อ, อีเมล, เบอร์โทร)
 *   - วันที่เช็คอิน/เช็คเอาท์
 *   - Dropdown เปลี่ยนสถานะ
 *   - รองรับ Mock Data เมื่อไม่มีข้อมูลจริง
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

import { getBackendUrl } from '@/lib/api'

/** Supabase client สำหรับ Admin */


/** Admin Sidebar component */
import AdminSidebar from '@/components/admin/Sidebar'

/** Utility functions */
import { formatCurrency, formatDate } from '@chiangrai/shared/utils'

/** Status Select component (Client) */
import BookingStatusSelect from './StatusSelect'

/** Type definitions */
import { BookingStatus } from '@chiangrai/shared/types'

/** Mock data สำหรับ fallback */


// ============================================================
// Metadata
// ============================================================

/** Page metadata สำหรับ SEO */
export const metadata = {
  title: 'จัดการการจอง | Admin',
}

// ============================================================
// Type Definitions
// ============================================================

/**
 * Interface สำหรับข้อมูลการจอง
 */
interface BookingRow {
  /** ID ของการจอง */
  id: string
  /** รหัสการจอง */
  booking_code: string
  /** ชื่อลูกค้า */
  customer_name: string
  /** อีเมลลูกค้า */
  customer_email: string
  /** เบอร์โทรลูกค้า */
  customer_phone: string
  /** วันที่เช็คอิน */
  check_in_date: string
  /** วันที่เช็คเอาท์ */
  check_out_date: string
  /** ราคารวม */
  total_price: number
  /** สถานะการจอง */
  status: BookingStatus
  /** ข้อมูลโรงแรม (ถ้ามี) */
  hotel?: { name_th: string } | null
  /** ข้อมูลรถ (ถ้ามี) */
  car?: { name_th: string } | null
}

// ============================================================
// Data Fetching Functions
// ============================================================

/**
 * ดึงรายการการจองทั้งหมด
 *
 * @description
 *   ดึงการจองจาก Supabase พร้อม join ข้อมูลโรงแรม/รถ
 *   เรียงตามวันที่สร้าง (ล่าสุดก่อน)
 *   ถ้าไม่มีข้อมูล จะใช้ Mock Data แทน
 *
 * @returns {Promise<BookingRow[]>} รายการการจอง
 */
async function getBookings(): Promise<BookingRow[]> {
  // ดึงผ่าน backend API
  const res = await fetch(`${getBackendUrl()}/api/bookings`, {
    cache: 'no-store',
  })

  const json = (await res.json()) as { data?: BookingRow[]; error?: string }

  if (!res.ok) {
    throw new Error(json.error || 'ไม่สามารถดึงรายการการจองได้')
  }

  return json.data || []
}

// ============================================================
// Main Component
// ============================================================

/**
 * หน้าจัดการการจองสำหรับ Admin
 *
 * @description
 *   แสดงตารางรายการการจองทั้งหมด
 *   พร้อม dropdown เปลี่ยนสถานะ
 *
 * @returns {Promise<JSX.Element>} Admin bookings page UI
 */
export default async function AdminBookingsPage() {
  // ----------------------------------------------------------
  // Fetch Data
  // ----------------------------------------------------------
  const bookings = await getBookings()

  const totalCount = bookings.length
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length
  const confirmedCount = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'COMPLETED'
  ).length
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="flex">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">จัดการการจอง</h1>
              <p className="text-sm text-slate-500 mt-1">ตรวจสอบและอัปเดตสถานะการจองได้อย่างรวดเร็ว</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm">
              ทั้งหมด <span className="font-semibold">{totalCount}</span> รายการ
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs text-slate-500 mb-1">รอดำเนินการ</p>
              <p className="text-xl font-bold text-slate-900">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs text-slate-500 mb-1">ยืนยันแล้ว</p>
              <p className="text-xl font-bold text-slate-900">{confirmedCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs text-slate-500 mb-1">ยกเลิก</p>
              <p className="text-xl font-bold text-slate-900">{cancelledCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs text-slate-500 mb-1">รายได้รวม</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs text-slate-500 mb-1">ทั้งหมด</p>
              <p className="text-xl font-bold text-slate-900">{totalCount}</p>
            </div>
          </div>

        {/* ============================================================
            Bookings Table
            ============================================================ */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">รายการการจอง</h2>
              <span className="text-xs text-slate-500">อัปเดตล่าสุดแบบเรียลไทม์</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
              {/* Table Header */}
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">รหัส</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ลูกค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">รายการ</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">วันที่</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ราคา</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">สถานะ</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    {/* รหัสการจอง */}
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                      {booking.booking_code}
                    </td>

                    {/* ข้อมูลลูกค้า */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{booking.customer_name}</div>
                      <div className="text-xs text-slate-500">{booking.customer_email}</div>
                      <div className="text-xs text-slate-500">{booking.customer_phone}</div>
                    </td>

                    {/* รายการ (โรงแรม/รถ) */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {booking.hotel?.name_th || booking.car?.name_th || '-'}
                    </td>

                    {/* วันที่ */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div>{formatDate(booking.check_in_date)}</div>
                      <div className="text-xs">ถึง {formatDate(booking.check_out_date)}</div>
                    </td>

                    {/* ราคา */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(booking.total_price)}
                    </td>

                    {/* สถานะ (Dropdown) */}
                    <td className="px-6 py-4">
                      <BookingStatusSelect
                        bookingCode={booking.booking_code}
                        currentStatus={booking.status}
                      />
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                      ยังไม่มีการจองในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}
