/**
 * ============================================================
 * Payment Table Component - ตารางแสดงรายการการชำระเงิน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการการชำระเงินในรูปแบบตาราง
 *   - รองรับการ filter และ pagination
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

import { useState } from 'react'
import { formatCurrency, formatDate } from '@chiangrai/shared/utils'
import { PaymentStatus } from '@chiangrai/shared/types'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Interface สำหรับข้อมูลการชำระเงิน
 */
interface Payment {
  id: string
  booking_id: string
  stripe_payment_intent_id?: string | null
  stripe_checkout_session_id?: string | null
  amount: number
  currency: string
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
  payments: Payment[]
  onStatusChange?: (paymentId: string, newStatus: PaymentStatus) => void
}

// ============================================================
// Status Badge Component
// ============================================================

/**
 * Component สำหรับแสดงสถานะการชำระเงิน
 */
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

// ============================================================
// Main Component
// ============================================================

/**
 * Payment Table Component
 *
 * @description
 *   แสดงตารางรายการการชำระเงิน
 *   พร้อมข้อมูลการจองที่เกี่ยวข้อง
 *
 * @param {PaymentTableProps} props - Component props
 * @returns {JSX.Element} Payment table UI
 */
export default function PaymentTable({ payments, onStatusChange }: PaymentTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
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

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                {/* รหัสการจอง */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-slate-900">
                    {payment.booking?.booking_code || 'N/A'}
                  </span>
                </td>

                {/* ลูกค้า */}
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

                {/* จำนวนเงิน */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">{payment.currency}</span>
                </td>

                {/* สถานะ */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={payment.status} />
                </td>

                {/* วันที่ชำระ */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {payment.paid_at ? formatDate(payment.paid_at) : '-'}
                </td>

                {/* วันที่สร้าง */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {formatDate(payment.created_at)}
                </td>
              </tr>
            ))}

            {/* Empty State */}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  ไม่พบข้อมูลการชำระเงิน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
