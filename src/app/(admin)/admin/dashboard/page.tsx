import { createAdminClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/Sidebar'
import { Building2, Car, Calendar, DollarSign, Plus, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BookingStatus } from '@/types'
import { calculateMockStats, MOCK_BOOKINGS, MOCK_HOTELS, MOCK_CARS } from '@/lib/mock-data'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard | Admin',
}

interface RevenueRow {
  total_price: number
}

async function getStats() {
  const supabase = await createAdminClient()

  const [hotelsRes, carsRes, bookingsRes, revenueRes] = await Promise.all([
    supabase.from('hotels').select('*', { count: 'exact', head: true }),
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('total_price').eq('status', 'PAID'),
  ])

  // Use Mock Data if no data from Supabase
  if (!hotelsRes.count && !carsRes.count && !bookingsRes.count) {
    const mockStats = calculateMockStats()
    return {
      totalHotels: mockStats.totalHotels,
      totalCars: mockStats.totalCars,
      totalBookings: mockStats.totalBookings,
      totalRevenue: mockStats.totalRevenue,
    }
  }

  const revenueData = (revenueRes.data || []) as RevenueRow[]
  const totalRevenue = revenueData.reduce((sum: number, b: RevenueRow) => sum + Number(b.total_price), 0)

  return {
    totalHotels: hotelsRes.count || 0,
    totalCars: carsRes.count || 0,
    totalBookings: bookingsRes.count || 0,
    totalRevenue,
  }
}

interface RecentBooking {
  id: string
  booking_code: string
  customer_name: string
  total_price: number
  status: BookingStatus
  hotel?: { name_th: string } | null
  car?: { name_th: string } | null
}

async function getRecentBookings(): Promise<RecentBooking[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('bookings')
    .select('*, hotel:hotels(name_th), car:cars(name_th)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Use Mock Data if no data from Supabase
  if (!data || data.length === 0) {
    return MOCK_BOOKINGS.slice(0, 5).map(booking => ({
      id: booking.id,
      booking_code: booking.booking_code,
      customer_name: booking.customer_name,
      total_price: booking.total_price,
      status: booking.status,
      hotel: booking.hotel ? { name_th: booking.hotel.name_th } : null,
      car: booking.car ? { name_th: booking.car.name_th } : null,
    }))
  }

  return (data || []) as RecentBooking[]
}

export default async function DashboardPage() {
  const stats = await getStats()
  const recentBookings = await getRecentBookings()

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

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">ภาพรวมระบบและการจองล่าสุด</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/hotels"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              เพิ่มโรงแรม
            </Link>
            <Link
              href="/admin/cars"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              <Plus size={18} />
              เพิ่มรถ
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
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
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <p className="text-slate-500 text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{stat.value}</p>
            </Link>
          ))}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">การจองล่าสุด</h2>
            <Link
              href="/admin/bookings"
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
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link href="/admin/bookings" className="text-indigo-600 hover:text-indigo-700">
                        {booking.booking_code}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{booking.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {booking.hotel?.name_th || booking.car?.name_th || '-'}
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
                         booking.status === 'CANCELLED' ? 'ยกเลิก' :
                         booking.status === 'COMPLETED' ? 'เสร็จสิ้น' :
                         booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
