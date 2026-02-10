'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Search } from 'lucide-react'
import SelectDropdown from '@/components/ui/SelectDropdown'
import { formatCurrency } from '@chiangrai/shared/utils'
import { Car } from '@chiangrai/shared/types'
import DeleteCarButton from './DeleteButton'

const ITEMS_PER_PAGE = 10

const statusOptions = [
  { value: 'ALL', label: 'สถานะทั้งหมด', dot: 'bg-indigo-500' },
  { value: 'ACTIVE', label: 'เปิดใช้งาน', dot: 'bg-green-500' },
  { value: 'INACTIVE', label: 'ปิดใช้งาน', dot: 'bg-red-500' },
]

interface CarsTableProps {
  cars: Car[]
}

export default function CarsTable({ cars }: CarsTableProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(1)

  // Filter + Search
  const filtered = cars.filter((car) => {
    const matchesSearch =
      !search ||
      car.name_th.toLowerCase().includes(search.toLowerCase()) ||
      car.name_en.toLowerCase().includes(search.toLowerCase()) ||
      car.car_type_th.toLowerCase().includes(search.toLowerCase()) ||
      car.car_type_en.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && car.is_active) ||
      (filterStatus === 'INACTIVE' && !car.is_active)

    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(page, totalPages)
  const paginatedCars = filtered.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  )

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const handleFilter = (value: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
    setFilterStatus(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อรถ, ประเภท..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <SelectDropdown
            options={statusOptions}
            value={filterStatus}
            onChange={(v) => handleFilter(v as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="min-w-[160px]"
          />
        </div>
      </div>

      {/* Table */}
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
              {paginatedCars.map((car) => (
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
              {paginatedCars.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {search || filterStatus !== 'ALL' ? 'ไม่พบผลลัพธ์' : 'ยังไม่มีรถ'}
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
