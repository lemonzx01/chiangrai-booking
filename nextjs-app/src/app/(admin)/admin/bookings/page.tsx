import { createAdminClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/Sidebar'
import { formatCurrency, formatDate } from '@/lib/utils'
import BookingStatusSelect from './StatusSelect'
import { Booking } from '@/types'

export const metadata = {
  title: 'จัดการการจอง | Admin',
}

interface BookingWithRelations extends Booking {
  hotel?: { name_th: string } | null
  car?: { name_th: string } | null
}

async function getBookings(): Promise<BookingWithRelations[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('bookings')
    .select('*, hotel:hotels(name_th), car:cars(name_th)')
    .order('created_at', { ascending: false })
  return (data || []) as BookingWithRelations[]
}

export default async function AdminBookingsPage() {
  const bookings = await getBookings()

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">จัดการการจอง</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">รหัส</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ลูกค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">รายการ</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">วันที่</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ราคา</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                      {booking.booking_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{booking.customer_name}</div>
                      <div className="text-xs text-slate-500">{booking.customer_email}</div>
                      <div className="text-xs text-slate-500">{booking.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {booking.hotel?.name_th || booking.car?.name_th || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div>{formatDate(booking.check_in_date)}</div>
                      <div className="text-xs">ถึง {formatDate(booking.check_out_date)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(booking.total_price)}
                    </td>
                    <td className="px-6 py-4">
                      <BookingStatusSelect
                        bookingCode={booking.booking_code}
                        currentStatus={booking.status}
                      />
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
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
