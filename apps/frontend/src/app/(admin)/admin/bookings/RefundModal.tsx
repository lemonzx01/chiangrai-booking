/**
 * ============================================================
 * Admin Refund Modal — manual refund for any amount
 * ============================================================
 *
 * Opens from the booking row "Refund" button. The admin enters:
 *   - amount (THB)   — capped at `maxRefundable`
 *   - reason         — required, appears in admin notifications
 *   - cancel_booking — optional; if ticked the booking is also
 *                      marked CANCELLED (useful for full refunds)
 *
 * POSTs to /api/admin/bookings/[code]/refund with CSRF via
 * apiFetch(), then refreshes the page on success.
 * ============================================================
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatCurrency } from '@chiangrai/shared/utils'

export interface RefundModalProps {
  open: boolean
  bookingCode: string
  customerName: string
  maxRefundable: number
  onClose: () => void
}

export default function RefundModal({
  open,
  bookingCode,
  customerName,
  maxRefundable,
  onClose,
}: RefundModalProps) {
  const router = useRouter()
  const [amount, setAmount] = useState<string>(String(maxRefundable))
  const [reason, setReason] = useState('')
  const [cancelBooking, setCancelBooking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('จำนวนเงินต้องมากกว่า 0')
      return
    }
    if (amt > maxRefundable + 0.01) {
      setError(`คืนเงินได้สูงสุด ${maxRefundable.toLocaleString()} บาท`)
      return
    }
    if (!reason.trim()) {
      setError('กรุณาระบุเหตุผลการคืนเงิน')
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch(`/api/admin/bookings/${bookingCode}/refund`, {
        method: 'POST',
        body: { amount: amt, reason: reason.trim(), cancel_booking: cancelBooking },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || 'คืนเงินไม่สำเร็จ')
        return
      }
      router.refresh()
      onClose()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">คืนเงิน — {bookingCode}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="text-sm text-slate-600">
            ลูกค้า: <span className="font-medium text-slate-900">{customerName}</span>
          </div>
          <div className="text-sm text-slate-600">
            คืนเงินได้สูงสุด:{' '}
            <span className="font-bold text-slate-900">{formatCurrency(maxRefundable)}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              จำนวนเงิน (บาท) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              max={maxRefundable}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
            />
            <div className="mt-1 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setAmount(String(maxRefundable))}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                เต็มจำนวน
              </button>
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(maxRefundable * 0.5 * 100) / 100))}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(maxRefundable * 0.25 * 100) / 100))}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                25%
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              เหตุผล <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={loading}
              rows={3}
              placeholder="เช่น ลูกค้าขอยกเลิกเนื่องจากอากาศไม่ดี"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm resize-none"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={cancelBooking}
              onChange={(e) => setCancelBooking(e.target.checked)}
              disabled={loading}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            <span className="text-sm text-slate-700">
              ยกเลิกการจองด้วย
              <span className="block text-xs text-slate-500 mt-0.5">
                (ห้องพัก / รถจะกลับมาว่างในช่วงวันที่เลือก)
              </span>
            </span>
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  กำลังคืนเงิน...
                </>
              ) : (
                'ยืนยันคืนเงิน'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
