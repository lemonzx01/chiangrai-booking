/**
 * ============================================================
 * ModificationRequestModal — customer asks to reschedule
 * ============================================================
 *
 * Opens from the customer's "ขอเลื่อนวัน" button on a booking
 * row in /profile. Posts the desired new dates + reason to
 * the modification-request endpoint, which drops an entry in
 * the admin inbox for the team to follow up.
 *
 * Design:
 *   - Customer DOESN'T get instant confirmation that the
 *     change applied — that's the admin's call. The success
 *     toast says "ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง".
 *   - The form pre-fills with the current dates so the
 *     customer can adjust by a day or two without retyping.
 *   - Reason is required; nothing kills admin productivity
 *     faster than vague "I want to change" requests.
 * ============================================================
 */

'use client'

import { useState } from 'react'
import { Loader2, X, CalendarClock } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'

export interface ModificationRequestModalProps {
  open: boolean
  bookingCode: string
  currentCheckIn: string
  currentCheckOut: string
  onClose: () => void
  onSubmitted?: () => void
}

export default function ModificationRequestModal({
  open,
  bookingCode,
  currentCheckIn,
  currentCheckOut,
  onClose,
  onSubmitted,
}: ModificationRequestModalProps) {
  const toast = useToast()
  const [checkIn, setCheckIn] = useState(currentCheckIn)
  const [checkOut, setCheckOut] = useState(currentCheckOut)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (checkOut <= checkIn) {
      setError('วันออกต้องอยู่หลังวันเข้า')
      return
    }
    if (
      checkIn === currentCheckIn &&
      checkOut === currentCheckOut
    ) {
      setError('วันที่ที่เลือกเหมือนเดิม กรุณาเลือกวันใหม่')
      return
    }
    if (!reason.trim()) {
      setError('กรุณาระบุเหตุผล')
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch(
        `/api/bookings/${bookingCode}/modification-request`,
        {
          method: 'POST',
          body: {
            requested_check_in: checkIn,
            requested_check_out: checkOut,
            reason: reason.trim(),
          },
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ||
            'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่'
        )
        return
      }
      toast.success(
        (data as { message?: string }).message ||
          'ส่งคำขอเลื่อนวันเรียบร้อย ทีมงานจะติดต่อกลับ'
      )
      onSubmitted?.()
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
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-slate-900" />
            <h2 className="text-lg font-bold text-slate-900">
              ขอเลื่อนวันจอง
            </h2>
          </div>
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
            การจอง:{' '}
            <span className="font-mono font-medium text-slate-900">
              {bookingCode}
            </span>
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
                วันเข้าใหม่ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                disabled={loading}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                วันออกใหม่ <span className="text-red-500">*</span>
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
              เหตุผล <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={loading}
              rows={3}
              maxLength={500}
              placeholder="เช่น เครื่องบินเลื่อน, มีงานด่วน, ฯลฯ"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm resize-none"
            />
            <div className="text-[11px] text-slate-400 text-right mt-1">
              {reason.length}/500
            </div>
          </div>

          <div className="rounded-lg bg-indigo-50 border border-slate-200 px-3 py-2 text-xs text-indigo-800">
            <strong>หมายเหตุ:</strong> ระบบจะส่งคำขอไปยังทีมงาน — ไม่ใช่การยืนยันทันที
            ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมงเพื่อยืนยันราคาและดำเนินการต่อไป
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
            >
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
                  กำลังส่ง...
                </>
              ) : (
                'ส่งคำขอ'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
