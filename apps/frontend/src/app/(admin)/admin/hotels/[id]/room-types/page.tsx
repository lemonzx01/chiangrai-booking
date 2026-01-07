import AdminSidebar from '@/components/admin/Sidebar'
import Link from 'next/link'
import { Plus, Pencil, ArrowLeft } from 'lucide-react'
import { RoomType, Currency } from '@chiangrai/shared/types'
import DeleteRoomTypeButton from './DeleteButton'
import { formatCurrency } from '@chiangrai/shared/utils'
import { getBackendUrl } from '@/lib/api'

interface Params {
  params: Promise<{ id: string }>
}

async function getHotel(id: string) {
  const res = await fetch(`${getBackendUrl()}/api/hotels/${id}`, {
    cache: 'no-store',
  })
  const json = (await res.json()) as { data?: any; error?: string }
  if (!res.ok) throw new Error(json.error || 'ไม่สามารถดึงข้อมูลโรงแรมได้')
  return json.data
}

async function getRoomTypes(hotelId: string): Promise<RoomType[]> {
  const res = await fetch(`${getBackendUrl()}/api/room-types?hotel_id=${hotelId}`, {
    cache: 'no-store',
  })
  const json = (await res.json()) as { data?: RoomType[]; error?: string }
  if (!res.ok) throw new Error(json.error || 'ไม่สามารถดึงข้อมูลประเภทห้องได้')
  return json.data || []
}

export default async function RoomTypesPage({ params }: Params) {
  const { id } = await params
  const hotel = await getHotel(id)
  const roomTypes = await getRoomTypes(id)

  if (!hotel) {
    return (
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <p className="text-slate-500">ไม่พบข้อมูลโรงแรม</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <Link
          href="/admin/hotels"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          กลับไปรายการโรงแรม
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              จัดการประเภทห้อง - {hotel.name_th}
            </h1>
            <p className="text-slate-500 mt-1">{hotel.name_en}</p>
          </div>
          <Link
            href={`/admin/hotels/${id}/room-types/new`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={20} />
            เพิ่มประเภทห้อง
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    ชื่อประเภทห้อง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    ราคาต่อคืน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    จำนวนผู้เข้าพักสูงสุด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roomTypes.map((roomType) => (
                  <tr key={roomType.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{roomType.name_th}</div>
                      <div className="text-sm text-slate-500">{roomType.name_en}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(roomType.price_per_night, Currency.THB)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {roomType.max_guests} คน
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          roomType.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {roomType.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/hotels/${id}/room-types/${roomType.id}/edit`}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </Link>
                        <DeleteRoomTypeButton id={roomType.id} />
                      </div>
                    </td>
                  </tr>
                ))}
                {roomTypes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      ยังไม่มีประเภทห้อง
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



