'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { BookingStatus } from '@chiangrai/shared/types'
import { formatCurrency, formatDate } from '@chiangrai/shared/utils'
import SelectDropdown from '@/components/ui/SelectDropdown'

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

interface PartnerBookingsTableProps {
  bookings: BookingRow[]
}

const statusOptions = [
  { value: 'ALL', label: 'All status', dot: 'bg-indigo-500' },
  { value: 'PENDING', label: 'Pending', dot: 'bg-yellow-500' },
  { value: 'CONFIRMED', label: 'Confirmed', dot: 'bg-blue-500' },
  { value: 'PAID', label: 'Paid', dot: 'bg-green-500' },
  { value: 'CANCELLED', label: 'Cancelled', dot: 'bg-red-500' },
  { value: 'COMPLETED', label: 'Completed', dot: 'bg-slate-500' },
]

function statusLabel(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending'
    case 'CONFIRMED':
      return 'Confirmed'
    case 'PAID':
      return 'Paid'
    case 'CANCELLED':
      return 'Cancelled'
    case 'COMPLETED':
      return 'Completed'
    default:
      return status
  }
}

function statusColor(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-700'
    case 'PAID':
      return 'bg-green-100 text-green-700'
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default function PartnerBookingsTable({ bookings }: PartnerBookingsTableProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const totalRevenue = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status !== 'CANCELLED')
        .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0),
    [bookings]
  )

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const keyword = search.trim().toLowerCase()
      const matchesSearch =
        !keyword ||
        booking.booking_code.toLowerCase().includes(keyword) ||
        booking.customer_name.toLowerCase().includes(keyword) ||
        booking.customer_email.toLowerCase().includes(keyword)

      const matchesStatus = status === 'ALL' || booking.status === status

      return matchesSearch && matchesStatus
    })
  }, [bookings, search, status])

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total bookings</p>
          <p className="text-xl font-bold text-slate-900">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Pending</p>
          <p className="text-xl font-bold text-slate-900">
            {bookings.filter((booking) => booking.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Confirmed / Paid</p>
          <p className="text-xl font-bold text-slate-900">
            {bookings.filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'PAID').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Revenue</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by booking code, customer, or email..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <SelectDropdown
            options={statusOptions}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            className="min-w-[180px]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Booking List</h2>
          <span className="text-xs text-slate-500">{filteredBookings.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-indigo-600">{booking.booking_code}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{booking.customer_name}</div>
                    <div className="text-xs text-slate-500">{booking.customer_email}</div>
                    <div className="text-xs text-slate-500">{booking.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {booking.car?.name_th || booking.hotel?.name_th || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div>{formatDate(booking.check_in_date)}</div>
                    <div className="text-xs">to {formatDate(booking.check_out_date)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(booking.total_price)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(booking.status)}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </td>
                </tr>
              ))}

              {paginatedBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    {search || status !== 'ALL' ? 'No matching bookings found.' : 'No bookings yet.'}
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
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of {filteredBookings.length}
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
                  itemPage === currentPage ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
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
