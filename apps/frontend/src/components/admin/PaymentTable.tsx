'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import SelectDropdown from '@/components/ui/SelectDropdown'
import { formatCurrency, formatDate } from '@chiangrai/shared/utils'
import { PaymentStatus, Currency } from '@chiangrai/shared/types'

const ITEMS_PER_PAGE = 10

interface PaymentWithBooking {
  id: string
  booking_id: string
  stripe_payment_intent_id?: string | null
  stripe_checkout_session_id?: string | null
  amount: number
  currency: string | Currency
  status: PaymentStatus
  paid_at?: string | null
  created_at: string
  updated_at: string
  booking?: {
    booking_code: string
    customer_name: string
    customer_email: string
    total_price: number
    hotel?: { name_th: string } | null
    car?: { name_th: string } | null
  } | null
}

interface PaymentTableProps {
  payments: PaymentWithBooking[]
  onStatusChange?: (paymentId: string, newStatus: PaymentStatus) => void
}

const statusFilterOptions = [
  { value: 'ALL', label: 'สถานะทั้งหมด', dot: 'bg-indigo-500' },
  { value: 'PENDING', label: 'รอดำเนินการ', dot: 'bg-yellow-500' },
  { value: 'SUCCEEDED', label: 'สำเร็จ', dot: 'bg-green-500' },
  { value: 'FAILED', label: 'ล้มเหลว', dot: 'bg-red-500' },
  { value: 'REFUNDED', label: 'คืนเงินแล้ว', dot: 'bg-gray-500' },
]

function StatusBadge({ status }: { status: PaymentStatus }) {
  const statusConfig = {
    PENDING: { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-700' },
    SUCCEEDED: { label: 'สำเร็จ', color: 'bg-green-100 text-green-700' },
    FAILED: { label: 'ล้มเหลว', color: 'bg-red-100 text-red-700' },
    REFUNDED: { label: 'คืนเงินแล้ว', color: 'bg-gray-100 text-gray-700' },
  }

  const config = statusConfig[status] || statusConfig.PENDING

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
      {config.label}
    </span>
  )
}

export default function PaymentTable({ payments, onStatusChange }: PaymentTableProps) {
  void onStatusChange

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const filtered = payments.filter((payment) => {
    const matchesSearch =
      !search ||
      (payment.booking?.booking_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (payment.booking?.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (payment.booking?.customer_email || '').toLowerCase().includes(search.toLowerCase())

    const matchesStatus = filterStatus === 'ALL' || payment.status === filterStatus

    return matchesSearch && matchesStatus
  })

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
      {/* Search + Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหารหัสจอง, ชื่อลูกค้า..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <SelectDropdown
            options={statusFilterOptions}
            value={filterStatus}
            onChange={handleFilter}
            className="min-w-[180px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  รหัสการจอง
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  จำนวนเงิน
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  วันที่ชำระ
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-900">
                      {payment.booking?.booking_code || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">
                        {payment.booking?.customer_name || 'N/A'}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {payment.booking?.customer_email || ''}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">{payment.currency}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {payment.paid_at ? formatDate(payment.paid_at) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(payment.created_at)}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    {search || filterStatus !== 'ALL' ? 'ไม่พบผลลัพธ์' : 'ไม่พบข้อมูลการชำระเงิน'}
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
