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

/** Supabase client สำหรับ Admin */
import { createAdminClient } from '@/lib/supabase/server'

/** Admin Sidebar component */
import AdminSidebar from '@/components/admin/Sidebar'

/** Next.js Link component */
import Link from 'next/link'

/** Lucide icons สำหรับ UI */
import { Plus, Pencil, Users } from 'lucide-react'

/** Utility functions */
import { formatCurrency } from '@/lib/utils'

/** Delete Button component (Client) */
import DeleteHotelButton from './DeleteButton'

/** Type definitions */
import { Hotel } from '@/types'

/** Mock data สำหรับ fallback */
import { MOCK_HOTELS } from '@/lib/constants'

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
  const supabase = await createAdminClient()

  // ----------------------------------------------------------
  // Query โรงแรมทั้งหมด
  // ----------------------------------------------------------
  const { data } = await supabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false })

  // ----------------------------------------------------------
  // ใช้ Mock Data ถ้าไม่มีข้อมูลจาก Supabase
  // ----------------------------------------------------------
  if (!data || data.length === 0) {
    return MOCK_HOTELS.map(hotel => ({
      ...hotel,
      location: hotel.location_th || hotel.location_en || '',
      updated_at: hotel.created_at,
    })) as Hotel[]
  }

  return (data || []) as Hotel[]
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

        {/* ============================================================
            Hotels Table
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              {/* Table Header */}
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ชื่อ</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ที่ตั้ง</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ราคา/คืน</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">สถานะ</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">จัดการ</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100">
                {hotels.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-slate-50">
                    {/* ชื่อโรงแรม (TH/EN) */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{hotel.name_th}</div>
                      <div className="text-sm text-slate-500">{hotel.name_en}</div>
                    </td>

                    {/* ที่ตั้ง */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {hotel.location || hotel.location_th || hotel.location_en}
                    </td>

                    {/* ราคาต่อคืน */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(hotel.price_per_night)}
                    </td>

                    {/* สถานะ Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        hotel.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {hotel.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* ปุ่มจัดการประเภทห้อง */}
                        <Link
                          href={`/admin/hotels/${hotel.id}/room-types`}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="จัดการประเภทห้อง"
                        >
                          <Users size={18} />
                        </Link>
                        {/* ปุ่มแก้ไข */}
                        <Link
                          href={`/admin/hotels/${hotel.id}/edit`}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="แก้ไขโรงแรม"
                        >
                          <Pencil size={18} />
                        </Link>
                        {/* ปุ่มลบ */}
                        <DeleteHotelButton id={hotel.id} />
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {hotels.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      ยังไม่มีโรงแรม
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
