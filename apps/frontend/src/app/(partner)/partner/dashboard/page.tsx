/**
 * ============================================================
 * Partner Dashboard Page - หน้า Dashboard สำหรับ Partner
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงภาพรวมสถิติของ Partner (รถ, การจอง)
 *   - แสดงการจองล่าสุดของรถตัวเอง
 *
 * Route:
 *   - /partner/dashboard - หน้า Dashboard หลัก
 *
 * ============================================================
 */

import PartnerSidebar from '@/components/partner/Sidebar'
import { Car, Calendar, DollarSign, Plus, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@chiangrai/shared/utils'
import { BookingStatus } from '@chiangrai/shared/types'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard | Partner',
}

export const dynamic = 'force-dynamic'

interface RecentBooking {
  id: string
  booking_code: string
  customer_name: string
  total_price: number
  status: BookingStatus
  car?: { name_th: string } | null
}

async function getPartnerStats() {
  try {
    // ใช้ relative path เพื่อให้ rewrite rule ทำงาน
    // หรือใช้ absolute URL ถ้า BACKEND_URL ถูกตั้งค่า
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const apiUrl = process.env.BACKEND_URL 
      ? `${backendUrl}/api/cars`
      : '/api/cars' // ใช้ relative path เพื่อให้ rewrite rule proxy ไปยัง backend
    
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      console.error('Failed to fetch cars:', res.status, res.statusText)
      return { totalCars: 0, totalBookings: 0, totalRevenue: 0 }
    }

    const json = (await res.json()) as { data?: any[]; error?: string }

    // API อาจ return array โดยตรง หรือ wrap ใน { data: [...] }
    const cars = Array.isArray(json) ? json : (json.data || [])
    const totalCars = cars.length

    // TODO: ดึงข้อมูล bookings และ revenue จาก API
    return {
      totalCars,
      totalBookings: 0,
      totalRevenue: 0,
    }
  } catch (error) {
    console.error('Error fetching partner stats:', error)
    return { totalCars: 0, totalBookings: 0, totalRevenue: 0 }
  }
}

async function getRecentBookings(): Promise<RecentBooking[]> {
  // TODO: สร้าง API endpoint สำหรับ partner bookings
  return []
}

export default async function PartnerDashboardPage() {
  const stats = await getPartnerStats()
  const recentBookings = await getRecentBookings()

  const statCards = [
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

  return (
    <div className="flex">
      <PartnerSidebar />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">ภาพรวมรถและการจองของคุณ</p>
          </div>

          <Link
            href="/partner/cars/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={18} />
            เพิ่มรถ
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
              <p className="text-slate-500 text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">การจองล่าสุด</h2>
            <Link
              href="/partner/bookings"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              ดูทั้งหมด
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">รหัส</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ลูกค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">รายการ</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ราคา</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">สถานะ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      ยังไม่มีการจอง
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">
                        <Link href="/partner/bookings" className="text-indigo-600 hover:text-indigo-700">
                          {booking.booking_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{booking.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {booking.car?.name_th || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {formatCurrency(booking.total_price)}
                      </td>
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
                           booking.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
