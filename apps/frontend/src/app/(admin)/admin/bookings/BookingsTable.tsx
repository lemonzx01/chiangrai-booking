'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { formatCurrency, formatDate } from '@chiangrai/shared/utils'
import { BookingStatus } from '@chiangrai/shared/types'
import BookingStatusSelect from './StatusSelect'

const ITEMS_PER_PAGE = 10

interface BookingRow {
  id: string
  booking_code: string
  customer_name: string
  customer_email: string
  customer_phone: string
  check_in_date: string
  check_out_date: string
  total_price: number
  status: BookingStatus
  hotel?: { name_th: string } | null
  car?: { name_th: string } | null
}

interface BookingsTableProps {
  bookings: BookingRow[]
}

const statusOptions = [
  { value: 'ALL', label: 'สถานะทั้งหมด', dot: 'bg-indigo-500' },
  { value: 'PENDING', label: 'รอดำเนินการ', dot: 'bg-yellow-500' },
  { value: 'CONFIRMED', label: 'ยืนยันแล้ว', dot: 'bg-blue-500' },
  { value: 'PAID', label: 'ชำระเงินแล้ว', dot: 'bg-green-500' },
  { value: 'CANCELLED', label: 'ยกเลิก', dot: 'bg-red-500' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น', dot: 'bg-gray-500' },
]

export default function BookingsTable({ bookings }: BookingsTableProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const filterRef = useRef<HTMLDivElement>(null)

  // Close filter dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    if (filterOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  // Summary counts
  const totalCount = bookings.length
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length
  const confirmedCount = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'COMPLETED'
  ).length
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length
  const totalRevenue = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + (b.total_price || 0), 0)

  // Filter + Search
  const filtered = bookings.filter((booking) => {
    const matchesSearch =
      !search ||
      booking.booking_code.toLowerCase().includes(search.toLowerCase()) ||
      booking.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      booking.customer_email.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = filterStatus === 'ALL' || booking.status === filterStatus

    return matchesSearch && matchesStatus
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
  const handleFilter = (value: string) => {
    setFilterStatus(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          onClick={() => handleFilter('PENDING')}
          className={`bg-white rounded-2xl border shadow-sm p-4 text-left transition-colors ${
            filterStatus === 'PENDING' ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-slate-100'
          }`}
        >
          <p className="text-xs text-slate-500 mb-1">รอดำเนินการ</p>
          <p className="text-xl font-bold text-slate-900">{pendingCount}</p>
        </button>
        <button
          onClick={() => handleFilter(filterStatus === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
          className={`bg-white rounded-2xl border shadow-sm p-4 text-left transition-colors ${
            filterStatus === 'CONFIRMED' ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-100'
          }`}
        >
          <p className="text-xs text-slate-500 mb-1">ยืนยันแล้ว</p>
          <p className="text-xl font-bold text-slate-900">{confirmedCount}</p>
        </button>
        <button
          onClick={() => handleFilter(filterStatus === 'CANCELLED' ? 'ALL' : 'CANCELLED')}
          className={`bg-white rounded-2xl border shadow-sm p-4 text-left transition-colors ${
            filterStatus === 'CANCELLED' ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-100'
          }`}
        >
          <p className="text-xs text-slate-500 mb-1">ยกเลิก</p>
          <p className="text-xl font-bold text-slate-900">{cancelledCount}</p>
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">รายได้รวม</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <button
          onClick={() => handleFilter('ALL')}
          className={`bg-white rounded-2xl border shadow-sm p-4 text-left transition-colors ${
            filterStatus === 'ALL' ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-100'
          }`}
        >
          <p className="text-xs text-slate-500 mb-1">ทั้งหมด</p>
          <p className="text-xl font-bold text-slate-900">{totalCount}</p>
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหารหัสจอง, ชื่อลูกค้า, อีเมล..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm hover:border-slate-300 transition-colors bg-white min-w-[160px]"
            >
              <span className={`w-2 h-2 rounded-full ${statusOptions.find(o => o.value === filterStatus)?.dot || 'bg-indigo-500'}`} />
              <span className="flex-1 text-left font-medium text-slate-700">
                {statusOptions.find(o => o.value === filterStatus)?.label || 'สถานะทั้งหมด'}
              </span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-[180px]">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { handleFilter(opt.value); setFilterOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      filterStatus === opt.value ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">รายการการจอง</h2>
          <span className="text-xs text-slate-500">
            {filtered.length} รายการ
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
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
              {paginated.map((booking) => (
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
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    {search || filterStatus !== 'ALL' ? 'ไม่พบผลลัพธ์' : 'ยังไม่มีการจองในระบบ'}
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
