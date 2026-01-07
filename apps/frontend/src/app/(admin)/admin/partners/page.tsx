/**
 * ============================================================
 * Admin Partners Page - หน้าจัดการพาร์ทเนอร์ (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการพาร์ทเนอร์ทั้งหมด
 *   - จัดการ CRUD สำหรับพาร์ทเนอร์
 *
 * Route:
 *   - /admin/partners - หน้ารายการพาร์ทเนอร์
 *
 * Features:
 *   - ตารางแสดงรายการพาร์ทเนอร์
 *   - แยกประเภท (โรงแรม/คนขับ)
 *   - ปุ่มเพิ่ม/แก้ไข/ลบ
 *   - นับจำนวนพาร์ทเนอร์แต่ละประเภท
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

/** Partners Table component (Client) */
import PartnersTable from './PartnersTable'

/** Type definitions */
import { Partner, PartnerType } from '@chiangrai/shared/types'

// ============================================================
// Metadata
// ============================================================

/** Page metadata สำหรับ SEO */
export const metadata = {
  title: 'จัดการพาร์ทเนอร์ | Admin',
}

// ============================================================
// Data Fetching Functions
// ============================================================

/**
 * ดึงรายการพาร์ทเนอร์ทั้งหมด
 *
 * @description
 *   ดึงพาร์ทเนอร์จาก Supabase เรียงตามวันที่สร้าง (ล่าสุดก่อน)
 *
 * @returns {Promise<Partner[]>} รายการพาร์ทเนอร์
 */
async function getPartners(): Promise<Partner[]> {
  const res = await fetch(`${getBackendUrl()}/api/partners`, {
    cache: 'no-store',
  })

  const json = (await res.json()) as { data?: Partner[]; error?: string }

  if (!res.ok) {
    throw new Error(json.error || 'ไม่สามารถดึงรายการพาร์ทเนอร์ได้')
  }

  return json.data || []
}

// ============================================================
// Main Component
// ============================================================

/**
 * หน้าจัดการพาร์ทเนอร์สำหรับ Admin
 *
 * @description
 *   แสดงตารางรายการพาร์ทเนอร์ทั้งหมด
 *   พร้อมแยกประเภทและนับจำนวน
 *
 * @returns {Promise<JSX.Element>} Admin partners page UI
 */
export default async function AdminPartnersPage() {
  // ----------------------------------------------------------
  // Fetch Data
  // ----------------------------------------------------------
  const partners = await getPartners()

  // ----------------------------------------------------------
  // นับจำนวนพาร์ทเนอร์แต่ละประเภท
  // ----------------------------------------------------------
  /** พาร์ทเนอร์ประเภทโรงแรม */
  const hotelPartners = partners.filter((p) => p.type === PartnerType.HOTEL)

  /** พาร์ทเนอร์ประเภทคนขับ */
  const driverPartners = partners.filter((p) => p.type === PartnerType.DRIVER)

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">จัดการพาร์ทเนอร์</h1>

          {/* ปุ่มเพิ่มพาร์ทเนอร์ */}
          <Link
            href="/admin/partners/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={20} />
            เพิ่มพาร์ทเนอร์
          </Link>
        </div>

        {/* ============================================================
            Partners Table (Client Component)
            ============================================================ */}
        <PartnersTable
          partners={partners}
          hotelCount={hotelPartners.length}
          driverCount={driverPartners.length}
        />
      </main>
    </div>
  )
}
