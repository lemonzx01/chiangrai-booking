'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Search } from 'lucide-react'
import DeletePartnerButton from './DeleteButton'
import { Partner, PartnerType } from '@chiangrai/shared/types'

const ITEMS_PER_PAGE = 10

interface PartnersTableProps {
  partners: Partner[]
  hotelCount: number
  driverCount: number
}

export default function PartnersTable({ partners, hotelCount, driverCount }: PartnersTableProps) {
  const [filterType, setFilterType] = useState<'ALL' | PartnerType>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const getTypeLabel = (type: PartnerType) => {
    return type === PartnerType.HOTEL ? 'โรงแรม' : 'คนขับรถ'
  }

  const getTypeBadgeColor = (type: PartnerType) => {
    return type === PartnerType.HOTEL
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700'
  }

  // Filter + Search
  const filtered = partners.filter((partner) => {
    const matchesType = filterType === 'ALL' || partner.type === filterType

    const matchesSearch =
      !search ||
      partner.name.toLowerCase().includes(search.toLowerCase()) ||
      partner.email.toLowerCase().includes(search.toLowerCase()) ||
      (partner.phone || '').toLowerCase().includes(search.toLowerCase())

    return matchesType && matchesSearch
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  )

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const handleFilterType = (value: 'ALL' | PartnerType) => {
    setFilterType(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs + Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterType('ALL')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filterType === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({partners.length})
            </button>
            <button
              onClick={() => handleFilterType(PartnerType.HOTEL)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filterType === PartnerType.HOTEL
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              โรงแรม ({hotelCount})
            </button>
            <button
              onClick={() => handleFilterType(PartnerType.DRIVER)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filterType === PartnerType.DRIVER
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              คนขับรถ ({driverCount})
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Partners Table */}
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
              {paginated.map((partner) => (
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
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    {search || filterType !== 'ALL'
                      ? 'ไม่พบผลลัพธ์'
                      : 'ยังไม่มีพาร์ทเนอร์'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 px-4 py-3">
          <span className="text-sm text-slate-500">
            แสดง {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filtered.length)} จาก {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              &#9664;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  p === safeCurrentPage ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              &#9654;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
