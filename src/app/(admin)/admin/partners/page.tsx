import { createAdminClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/Sidebar'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import DeletePartnerButton from './DeleteButton'
import { Partner } from '@/types'
import { PartnerType } from '@/types'

export const metadata = {
  title: 'จัดการพาร์ทเนอร์ | Admin',
}

async function getPartners(): Promise<Partner[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false })

  return (data || []) as Partner[]
}

export default async function AdminPartnersPage() {
  const partners = await getPartners()

  const getTypeLabel = (type: PartnerType) => {
    return type === PartnerType.HOTEL ? 'โรงแรม' : 'คนขับรถ'
  }

  const getTypeBadgeColor = (type: PartnerType) => {
    return type === PartnerType.HOTEL
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700'
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">จัดการพาร์ทเนอร์</h1>
          <Link
            href="/admin/partners/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={20} />
            เพิ่มพาร์ทเนอร์
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    ชื่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    อีเมล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    คอมมิชชั่น
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
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{partner.name}</div>
                      {partner.phone && (
                        <div className="text-sm text-slate-500">{partner.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{partner.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(
                          partner.type
                        )}`}
                      >
                        {getTypeLabel(partner.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {partner.commission_rate}%
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          partner.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {partner.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/partners/${partner.id}/edit`}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </Link>
                        <DeletePartnerButton id={partner.id} />
                      </div>
                    </td>
                  </tr>
                ))}
                {partners.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      ยังไม่มีพาร์ทเนอร์
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

