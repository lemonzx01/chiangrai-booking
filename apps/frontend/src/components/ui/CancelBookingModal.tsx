'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import Button from './Button'

interface CancelBookingModalProps {
  bookingCode: string
  bookingStatus: string
  checkInDate: string
  totalPrice: number
  currency?: string
  onClose: () => void
  onCancelled: () => void
}

/**
 * คำนวณ refund percentage (client-side preview - server จะคำนวณอีกที)
 */
function getRefundPreview(checkInDate: string): { percentage: number; label: string } {
  const now = new Date()
  const checkIn = new Date(checkInDate)
  const diffMs = checkIn.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays >= 7) return { percentage: 100, label: 'คืนเงินเต็มจำนวน (100%)' }
  if (diffDays >= 3) return { percentage: 50, label: 'คืนเงิน 50%' }
  return { percentage: 0, label: 'ไม่มีการคืนเงิน' }
}

export default function CancelBookingModal({
  bookingCode,
  bookingStatus,
  checkInDate,
  totalPrice,
  currency = 'THB',
  onClose,
  onCancelled,
}: CancelBookingModalProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  const refundPreview = bookingStatus === 'PAID'
    ? getRefundPreview(checkInDate)
    : { percentage: 0, label: bookingStatus === 'PENDING' ? 'ยังไม่ได้ชำระเงิน (ไม่มีการคืนเงิน)' : 'ไม่มีการคืนเงิน' }

  const refundAmount = Math.round((totalPrice * refundPreview.percentage) / 100 * 100) / 100

  const handleCancel = async () => {
    setCancelling(true)
    setError('')

    try {
      const res = await fetch(`/api/bookings/${bookingCode}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'ไม่สามารถยกเลิกได้')
      }

      onCancelled()
    } catch (err: any) {
      setError(err.message)
      setCancelling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">
              {lang === 'th' ? 'ยกเลิกการจอง' : 'Cancel Booking'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking Code */}
        <p className="text-sm text-slate-500 mb-4">
          {lang === 'th' ? 'รหัสการจอง' : 'Booking Code'}: <strong>{bookingCode}</strong>
        </p>

        {/* Refund Policy */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            {lang === 'th' ? 'นโยบายคืนเงิน' : 'Refund Policy'}
          </h3>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>7+ {lang === 'th' ? 'วันก่อนเข้าพัก' : 'days before check-in'} → {lang === 'th' ? 'คืน 100%' : '100% refund'}</li>
            <li>3-7 {lang === 'th' ? 'วันก่อนเข้าพัก' : 'days before check-in'} → {lang === 'th' ? 'คืน 50%' : '50% refund'}</li>
            <li>&lt;3 {lang === 'th' ? 'วันก่อนเข้าพัก' : 'days before check-in'} → {lang === 'th' ? 'ไม่คืนเงิน' : 'No refund'}</li>
          </ul>
        </div>

        {/* Refund Preview */}
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">{lang === 'th' ? 'สถานะ' : 'Status'}:</span>
            <span className="font-medium">{refundPreview.label}</span>
          </div>
          {refundPreview.percentage > 0 && bookingStatus === 'PAID' && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{lang === 'th' ? 'เงินคืน' : 'Refund'}:</span>
              <span className="font-bold text-green-600">
                {refundAmount.toLocaleString()} {currency}
              </span>
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {lang === 'th' ? 'เหตุผลในการยกเลิก (ไม่บังคับ)' : 'Reason for cancellation (optional)'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={lang === 'th' ? 'ระบุเหตุผล...' : 'Enter reason...'}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
        </div>

        {/* Error */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={cancelling}>
            {lang === 'th' ? 'ไม่ยกเลิก' : 'Keep Booking'}
          </Button>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {cancelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {lang === 'th' ? 'ยืนยันยกเลิก' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
