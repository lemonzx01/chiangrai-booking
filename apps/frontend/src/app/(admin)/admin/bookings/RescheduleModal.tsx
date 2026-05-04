/**
 * ============================================================
 * RescheduleModal — admin moves a booking's date range
 * ============================================================
 *
 * Opens from the booking row "เลื่อนวัน" button. Driven by the
 * backend's POST /api/admin/bookings/[code]/reschedule endpoint
 * which:
 *   - validates the new range (end > start)
 *   - re-runs availability with the booking itself excluded
 *   - returns 409 with code DATES_BLOCKED / ROOM_FULL / CAR_FULL
 *     on conflict
 *   - records before/after to the admin audit log
 *
 * The "force" toggle bypasses the availability check — needed
 * for cases where partner manually agreed to overbook (e.g. a
 * VIP customer staying in an extra bed). It's NOT recommended
 * by default and the UI is quite explicit about that.
 * ============================================================
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'

export interface RescheduleModalProps {
  open: boolean
  bookingCode: string
  customerName: string
  currentCheckIn: string
  currentCheckOut: string
  onClose: () => void
}

export default function RescheduleModal({
  open,
  bookingCode,
  customerName,
  currentCheckIn,
  currentCheckOut,
  onClose,
}: RescheduleModalProps) {
  const router = useRouter()
  const toast = useToast()
  const [checkIn, setCheckIn] = useState(currentCheckIn)
  const [checkOut, setCheckOut] = useState(currentCheckOut)
  const [reason, setReason] = useState('')
  const [force, setForce] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (checkOut <= checkIn) {
      setError('วันเช็คเอาท์ต้องอยู่หลังวันเช็คอิน')
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch(
        `/api/admin/bookings/${bookingCode}/reschedule`,
        {
          method: 'POST',
          body: {
            check_in_date: checkIn,
            check_out_date: checkOut,
            reason: reason.trim() || undefined,
            force,
          },
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Surface backend's specific code so admin sees why
        const msg =
          (data as { error?: string }).error || 'เลื่อนการจองไม่สำเร็จ'
        setError(msg)
        return
      }
      if ((data as { noop?: boolean }).noop) {
        toast.info('วันที่ยังเหมือนเดิม')
      } else {
        toast.success('เลื่อนการจองสำเร็จ')
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
          <h2 className="text-lg font-bold text-slate-900">
            เลื่อนการจอง — {bookingCode}
          </h2>
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
            ลูกค้า:{' '}
            <span className="font-medium text-slate-900">{customerName}</span>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs">
            <div className="text-slate-500">วันเดิม:</div>
            <div className="font-mono text-slate-700 mt-0.5">
              {currentCheckIn} → {currentCheckOut}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                วันเช็คอินใหม่ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                วันเช็คเอาท์ใหม่ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                disabled={loading}
                min={checkIn}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              เหตุผล (สำหรับ audit log)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={2}
              placeholder="เช่น ลูกค้าขอเลื่อนเนื่องจากติดธุระ"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm resize-none"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              disabled={loading}
              className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-slate-700">
              บังคับเลื่อน (ข้ามการตรวจ availability)
              <span className="block text-xs text-amber-700 mt-0.5 flex items-start gap-1">
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                <span>ใช้เมื่อ partner ตกลงรับ overbook เท่านั้น</span>
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
              className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  กำลังเลื่อน...
                </>
              ) : (
                'ยืนยันเลื่อน'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
