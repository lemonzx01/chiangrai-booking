/**
 * ============================================================
 * Admin Dashboard Page - หน้า Dashboard สำหรับ Admin (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงภาพรวมสถิติของระบบ
 *   - แสดงการจองล่าสุด
 *   - เป็นหน้าแรกหลัง login Admin
 *
 * Route:
 *   - /admin/dashboard - หน้า Dashboard หลัก
 *
 * Features:
 *   - Stats Cards (จำนวนโรงแรม, รถ, การจอง, รายได้รวม)
 *   - ตารางการจองล่าสุด 5 รายการ
 *   - ปุ่มลัดเพิ่มโรงแรม/รถ
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

/** Lucide icons สำหรับ UI */
import { Building2, Car, Calendar, DollarSign, Plus, ArrowRight } from 'lucide-react'

/** Utility functions */
import { formatCurrency } from '@chiangrai/shared/utils'

/** Type definitions */
import { BookingStatus, type DashboardStats } from '@chiangrai/shared/types'

/** Mock data สำหรับ fallback */

/** Next.js Link component */
import Link from 'next/link'

// ============================================================
// Metadata
// ============================================================

/** Page metadata สำหรับ SEO */
export const metadata = {
  title: 'Dashboard | Admin',
}

// ============================================================
// Type Definitions
// ============================================================

/**
 * Interface สำหรับข้อมูลรายได้
 */

/**
 * Interface สำหรับข้อมูลการจองล่าสุด
 */
interface RecentBooking {
  /** ID ของการจอง */
  id: string
  /** รหัสการจอง */
  booking_code: string
  /** ชื่อลูกค้า */
  customer_name: string
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
 * ดึงข้อมูลสถิติรวมของระบบ
 *
 * @description
 *   ดึงจำนวนโรงแรม, รถ, การจอง, และรายได้รวมจาก Supabase
 *   ถ้าไม่มีข้อมูล จะใช้ Mock Data แทน
 *
 * @returns {Promise<Object>} ข้อมูลสถิติ
 */
async function getStats(): Promise<DashboardStats> {
  const res = await fetch(`${getBackendUrl()}/api/dashboard/stats`, {
    cache: 'no-store',
  });

  const json = (await res.json()) as { data?: DashboardStats; error?: string };

  if (!res.ok) {
    // Gracefully fail for now, as the endpoint might not exist yet
    console.error(json.error || 'Failed to fetch stats');
    return { totalHotels: 0, totalCars: 0, totalBookings: 0, totalRevenue: 0, pendingBookings: 0, confirmedBookings: 0 };
  }

  return json.data || { totalHotels: 0, totalCars: 0, totalBookings: 0, totalRevenue: 0, pendingBookings: 0, confirmedBookings: 0 };
}

/**
 * ดึงรายการการจองล่าสุด 5 รายการ
 *
 * @description
 *   ดึงการจองล่าสุดพร้อม join ข้อมูลโรงแรม/รถ
 *   ถ้าไม่มีข้อมูล จะใช้ Mock Data แทน
 *
 * @returns {Promise<RecentBooking[]>} รายการการจองล่าสุด
 */
async function getRecentBookings(): Promise<RecentBooking[]> {
  const res = await fetch(`${getBackendUrl()}/api/bookings?limit=5`, {
    cache: 'no-store',
  });

  const json = (await res.json()) as { data?: RecentBooking[]; error?: string };

  if (!res.ok) {
    console.error(json.error || 'Failed to fetch recent bookings');
    return [];
  }

  return json.data || [];
}

// ============================================================
// Main Component
// ============================================================

/**
 * หน้า Dashboard สำหรับ Admin
 *
 * @description
 *   แสดงภาพรวมระบบ พร้อมสถิติและการจองล่าสุด
 *
 * @returns {Promise<JSX.Element>} Admin dashboard page UI
 */
export default async function DashboardPage() {
  // ----------------------------------------------------------
  // Fetch Data
  // ----------------------------------------------------------
  /** ดึงข้อมูลสถิติและการจองล่าสุด */
  const stats = await getStats()
  const recentBookings = await getRecentBookings()

  // ----------------------------------------------------------
  // Stats Cards Configuration
  // ----------------------------------------------------------
  /**
   * การตั้งค่า Stat Cards
   * แต่ละ card มี: title, value, icon, color
   */
  const statCards = [
    {
      title: 'โรงแรม/แพ็คเกจ',
      value: stats.totalHotels,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      title: 'รถเช่า',
      value: stats.totalCars,
      icon: Car,
      color: 'bg-green-500',
    },
    {
      title: 'การจองทั้งหมด',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      title: 'รายได้รวม',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ]

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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">ภาพรวมระบบและการจองล่าสุด</p>
          </div>

          {/* Quick Actions - ปุ่มลัด */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {/* ปุ่มเพิ่มโรงแรม */}
            <Link
              href="/admin/hotels"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              <Plus size={18} />
              เพิ่มโรงแรม
            </Link>
            {/* ปุ่มเพิ่มรถ */}
            <Link
              href="/admin/cars"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm sm:text-base"
            >
              <Plus size={18} />
              เพิ่มรถ
            </Link>
          </div>
        </div>

        {/* ============================================================
            Stats Grid - แสดงสถิติเป็น Cards
            ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              href={
                stat.title.includes('โรงแรม') ? '/admin/hotels' :
                stat.title.includes('รถ') ? '/admin/cars' :
                '/admin/bookings'
              }
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
            >
              {/* Card Header - Icon และ Arrow */}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              {/* Card Content - Title และ Value */}
              <p className="text-slate-500 text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{stat.value}</p>
            </Link>
          ))}
        </div>

        {/* ============================================================
            Recent Bookings Table - ตารางการจองล่าสุด
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          {/* Table Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">การจองล่าสุด</h2>
            {/* Link ไปหน้ารายการการจองทั้งหมด */}
            <Link
              href="/admin/bookings"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              ดูทั้งหมด
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">รหัส</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ลูกค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">รายการ</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ราคา</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">สถานะ</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-indigo-50/50 transition-colors">
                    {/* รหัสการจอง */}
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link href="/admin/bookings" className="text-indigo-600 hover:text-indigo-700">
                        {booking.booking_code}
                      </Link>
                    </td>
                    {/* ชื่อลูกค้า */}
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{booking.customer_name}</td>
                    {/* รายการ (โรงแรม/รถ) */}
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {booking.hotel?.name_th || booking.car?.name_th || '-'}
                    </td>
                    {/* ราคา */}
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {formatCurrency(booking.total_price)}
                    </td>
                    {/* สถานะ Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${
                        booking.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status === 'PAID' ? 'ชำระแล้ว' :
                         booking.status === 'CONFIRMED' ? 'ยืนยันแล้ว' :
                         booking.status === 'PENDING' ? 'รอดำเนินการ' :
                         booking.status === 'CANCELLED' ? 'ยกเลิก' :
                         booking.status === 'COMPLETED' ? 'เสร็จสิ้น' :
                         booking.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      ยังไม่มีการจอง
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
