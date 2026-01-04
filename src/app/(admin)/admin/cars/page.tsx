import { createAdminClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/Sidebar'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import DeleteCarButton from './DeleteButton'
import { Car } from '@/types'
import { MOCK_CARS } from '@/lib/constants'

export const metadata = {
  title: 'จัดการรถเช่า | Admin',
}

async function getCars(): Promise<Car[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false })
  
  // Use Mock Data if no data from Supabase
  if (!data || data.length === 0) {
    return MOCK_CARS.map(car => ({
      ...car,
      updated_at: car.created_at,
    })) as Car[]
  }

  return (data || []) as Car[]
}

export default async function AdminCarsPage() {
  const cars = await getCars()

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">จัดการรถเช่า</h1>
          <Link
            href="/admin/cars/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={20} />
            เพิ่มรถ
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ชื่อ</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ประเภท</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ราคา/วัน</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">สถานะ</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cars.map((car) => (
                <tr key={car.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{car.name_th}</div>
                    <div className="text-sm text-slate-500">{car.name_en}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{car.car_type_th}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(car.price_per_day)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      car.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {car.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/cars/${car.id}/edit`}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={18} />
                      </Link>
                      <DeleteCarButton id={car.id} />
                    </div>
                  </td>
                </tr>
              ))}
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
