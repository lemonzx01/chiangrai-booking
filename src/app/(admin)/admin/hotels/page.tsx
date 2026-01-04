import { createAdminClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/Sidebar'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import DeleteHotelButton from './DeleteButton'
import { Hotel } from '@/types'
import { MOCK_HOTELS } from '@/lib/constants'

export const metadata = {
  title: 'จัดการโรงแรม | Admin',
}

async function getHotels(): Promise<Hotel[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('hotels')
    .select('*')
    .order('created_at', { ascending: false })
  
  // Use Mock Data if no data from Supabase
  if (!data || data.length === 0) {
    return MOCK_HOTELS.map(hotel => ({
      ...hotel,
      location: hotel.location_th || hotel.location_en || '',
      updated_at: hotel.created_at,
    })) as Hotel[]
  }

  return (data || []) as Hotel[]
}

export default async function AdminHotelsPage() {
  const hotels = await getHotels()

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">จัดการโรงแรม/แพ็คเกจ</h1>
          <Link
            href="/admin/hotels/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            เพิ่มโรงแรม
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ชื่อ</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ที่ตั้ง</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ราคา/คืน</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">สถานะ</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{hotel.name_th}</div>
                    <div className="text-sm text-slate-500">{hotel.name_en}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{hotel.location || hotel.location_th || hotel.location_en}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(hotel.price_per_night)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      hotel.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {hotel.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/hotels/${hotel.id}/edit`}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={18} />
                      </Link>
                      <DeleteHotelButton id={hotel.id} />
                    </div>
                  </td>
                </tr>
              ))}
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
      </main>
    </div>
  )
}
