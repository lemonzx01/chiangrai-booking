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

/** Type definitions */
import { BookingStatus } from '@chiangrai/shared/types'

/** Bookings Table component (Client) */
import BookingsTable from './BookingsTable'


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
          </div>

          {/* Bookings Table with Search/Filter/Pagination */}
          <BookingsTable bookings={bookings} />
        </div>
      </main>
    </div>
  )
}
