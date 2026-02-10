/**
 * ============================================================
 * Admin Cars Page - หน้าจัดการรถเช่า (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการรถเช่าทั้งหมด
 *   - จัดการ CRUD สำหรับรถเช่า
 *
 * Route:
 *   - /admin/cars - หน้ารายการรถเช่า
 *
 * Features:
 *   - ตารางแสดงรายการรถ
 *   - ปุ่มเพิ่มรถใหม่
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
import { Car } from '@chiangrai/shared/types'

/** Cars Table component (Client) */
import CarsTable from './CarsTable'


// ============================================================
// Metadata
// ============================================================

/** Page metadata สำหรับ SEO */
export const metadata = {
  title: 'จัดการรถเช่า | Admin',
}

// ============================================================
// Data Fetching Functions
// ============================================================

/**
 * ดึงรายการรถเช่าทั้งหมด
 *
 * @description
 *   ดึงรถจาก Supabase เรียงตามวันที่สร้าง (ล่าสุดก่อน)
 *   ถ้าไม่มีข้อมูล จะใช้ Mock Data แทน
 *
 * @returns {Promise<Car[]>} รายการรถเช่า
 */
async function getCars(): Promise<Car[]> {
  // ดึงผ่าน backend API
  const res = await fetch(`${getBackendUrl()}/api/cars`, {
    cache: 'no-store',
  })

  const json = (await res.json()) as { data?: Car[]; error?: string }

  if (!res.ok) {
    throw new Error(json.error || 'ไม่สามารถดึงรายการรถได้')
  }

  return json.data || []
}

// ============================================================
// Main Component
// ============================================================

/**
 * หน้าจัดการรถเช่าสำหรับ Admin
 *
 * @description
 *   แสดงตารางรายการรถทั้งหมด
 *   พร้อมปุ่มเพิ่ม/แก้ไข/ลบ
 *
 * @returns {Promise<JSX.Element>} Admin cars page UI
 */
export default async function AdminCarsPage() {
  // ----------------------------------------------------------
  // Fetch Data
  // ----------------------------------------------------------
  const cars = await getCars()

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">จัดการรถเช่า</h1>

          {/* ปุ่มเพิ่มรถ */}
          <Link
            href="/admin/cars/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={20} />
            เพิ่มรถ
          </Link>
        </div>

        {/* Cars Table with Search/Filter/Pagination */}
        <CarsTable cars={cars} />
      </main>
    </div>
  )
}
