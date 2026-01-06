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

/** Supabase client สำหรับ Admin */


/** Admin Sidebar component */
import AdminSidebar from '@/components/admin/Sidebar'

/** Next.js Link component */
import Link from 'next/link'

/** Lucide icons สำหรับ UI */
import { Plus, Pencil } from 'lucide-react'

/** Utility functions */
import { formatCurrency } from '@chiangrai/shared/utils'

/** Delete Button component (Client) */
import DeleteCarButton from './DeleteButton'

/** Type definitions */
import { Car } from '@chiangrai/shared/types'

/** Mock data สำหรับ fallback */


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
  // ดึงผ่าน backend API (frontend จะ rewrite /api/* ไป backend ใน production)
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/cars`, {
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

        {/* ============================================================
            Cars Table
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              {/* Table Header */}
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ชื่อ</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ประเภท</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ราคา/วัน</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">สถานะ</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">จัดการ</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100">
                {cars.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-50">
                    {/* ชื่อรถ (TH/EN) */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{car.name_th}</div>
                      <div className="text-sm text-slate-500">{car.name_en}</div>
                    </td>

                    {/* ประเภทรถ */}
                    <td className="px-6 py-4 text-sm text-slate-500">{car.car_type_th}</td>

                    {/* ราคาต่อวัน */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(car.price_per_day)}
                    </td>

                    {/* สถานะ Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        car.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {car.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* ปุ่มแก้ไข */}
                        <Link
                          href={`/admin/cars/${car.id}/edit`}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </Link>
                        {/* ปุ่มลบ */}
                        <DeleteCarButton id={car.id} />
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {cars.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      ยังไม่มีรถ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
