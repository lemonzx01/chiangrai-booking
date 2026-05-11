'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import SelectDropdown from '@/components/ui/SelectDropdown'
import { Car } from '@chiangrai/shared/types'
import { formatCurrency, formatDate } from '@chiangrai/shared/utils'

const ITEMS_PER_PAGE = 10

const statusOptions = [
  { value: 'ALL', label: 'All status', dot: 'bg-slate-700' },
  { value: 'ACTIVE', label: 'Active', dot: 'bg-green-500' },
  { value: 'INACTIVE', label: 'Inactive', dot: 'bg-red-500' },
]

interface PartnerCarsTableProps {
  cars: Car[]
}

export default function PartnerCarsTable({ cars }: PartnerCarsTableProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(1)

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const keyword = search.trim().toLowerCase()
      const matchesSearch =
        !keyword ||
        car.name_th.toLowerCase().includes(keyword) ||
        car.name_en.toLowerCase().includes(keyword) ||
        car.car_type_th.toLowerCase().includes(keyword) ||
        car.car_type_en.toLowerCase().includes(keyword)

      const matchesStatus =
        status === 'ALL' ||
        (status === 'ACTIVE' && car.is_active) ||
        (status === 'INACTIVE' && !car.is_active)

      return matchesSearch && matchesStatus
    })
  }, [cars, search, status])

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by car name or type..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
            />
          </div>

          <SelectDropdown
            options={statusOptions}
            value={status}
            onChange={(value) => {
              setStatus(value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              setPage(1)
            }}
            className="min-w-[170px]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Car List</h2>
          <span className="text-xs text-slate-500">{filteredCars.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Passengers</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Price / day</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedCars.map((car) => {
                const displayPrice = Number(car.base_price_per_day ?? car.price_per_day ?? 0)

                return (
                  <tr key={car.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{car.name_th}</div>
                      <div className="text-sm text-slate-500">{car.name_en}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{car.car_type_th}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{car.max_passengers}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(displayPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          car.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {car.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(car.created_at)}</td>
                  </tr>
                )
              })}

              {paginatedCars.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    {search || status !== 'ALL' ? 'No matching cars found.' : 'No cars yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 px-4 py-3">
          <span className="text-sm text-slate-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredCars.length)} of {filteredCars.length}
          </span>

          <div className="flex gap-1">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              &#9664;
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((itemPage) => (
              <button
                key={itemPage}
                onClick={() => setPage(itemPage)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  itemPage === currentPage ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                {itemPage}
              </button>
            ))}

            <button
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
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
