/**
 * ============================================================
 * Admin Hotels Page - หน้าจัดการโรงแรม (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการโรงแรม/แพ็คเกจทั้งหมด
 *   - จัดการ CRUD สำหรับโรงแรม
 *
 * Route:
 *   - /admin/hotels - หน้ารายการโรงแรม
 *
 * Features:
 *   - ตารางแสดงรายการโรงแรม
 *   - ปุ่มเพิ่มโรงแรมใหม่
 *   - ปุ่มแก้ไข/ลบแต่ละรายการ
 *   - แสดงราคาและสถานะ
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

/** Next.js Link component */
import Link from 'next/link'

/** Lucide icons สำหรับ UI */
import { Plus } from 'lucide-react'

/** Type definitions */
import { Hotel } from '@chiangrai/shared/types'

/** Hotels Table component (Client) */
import HotelsTable from './HotelsTable'

// ============================================================
// Metadata
// ============================================================

/** Page metadata สำหรับ SEO */
export const metadata = {
  title: 'จัดการโรงแรม | Admin',
}

// ============================================================
// Data Fetching Functions
// ============================================================

/**
 * ดึงรายการโรงแรมทั้งหมด
 *
 * @description
 *   ดึงโรงแรมจาก Supabase เรียงตามวันที่สร้าง (ล่าสุดก่อน)
 *   ถ้าไม่มีข้อมูล จะใช้ Mock Data แทน
 *
 * @returns {Promise<Hotel[]>} รายการโรงแรม
 */
async function getHotels(): Promise<Hotel[]> {
  const res = await fetch(`${getBackendUrl()}/api/hotels`, {
    cache: 'no-store',
  })

  const json = (await res.json()) as { data?: Hotel[]; error?: string }

  if (!res.ok) {
    throw new Error(json.error || 'ไม่สามารถดึงรายการโรงแรมได้')
  }

  return json.data || []
}

// ============================================================
// Main Component
// ============================================================

/**
 * หน้าจัดการโรงแรมสำหรับ Admin
 *
 * @description
 *   แสดงตารางรายการโรงแรมทั้งหมด
 *   พร้อมปุ่มเพิ่ม/แก้ไข/ลบ
 *
 * @returns {Promise<JSX.Element>} Admin hotels page UI
 */
export default async function AdminHotelsPage() {
  // ----------------------------------------------------------
  // Fetch Data
  // ----------------------------------------------------------
  const hotels = await getHotels()

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="flex">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {/* ============================================================
            Header Section
            ============================================================ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">จัดการโรงแรม/แพ็คเกจ</h1>

          {/* ปุ่มเพิ่มโรงแรม */}
          <Link
            href="/admin/hotels/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={20} />
            เพิ่มโรงแรม
          </Link>
        </div>

        {/* Hotels Table with Search/Filter/Pagination */}
        <HotelsTable hotels={hotels} />
      </main>
    </div>
  )
}
