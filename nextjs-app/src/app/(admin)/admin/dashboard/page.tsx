import { createAdminClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/Sidebar'
import { Building2, Car, Calendar, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Dashboard | Admin',
}

async function getStats() {
  const supabase = await createAdminClient()

  const [hotelsRes, carsRes, bookingsRes, revenueRes] = await Promise.all([
    supabase.from('hotels').select('*', { count: 'exact', head: true }),
    supabase.from('cars').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('total_price').eq('status', 'PAID'),
  ])

  const totalRevenue = revenueRes.data?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0

  return {
    totalHotels: hotelsRes.count || 0,
    totalCars: carsRes.count || 0,
    totalBookings: bookingsRes.count || 0,
    totalRevenue,
  }
}

async function getRecentBookings() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('bookings')
    .select('*, hotel:hotels(name_th), car:cars(name_th)')
    .order('created_at', { ascending: false })
    .limit(5)
  return data || []
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
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div key={stat.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
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

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">การจองล่าสุด</h2>
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
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                      {booking.booking_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{booking.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {booking.hotel?.name_th || booking.car?.name_th || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(booking.total_price)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
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
