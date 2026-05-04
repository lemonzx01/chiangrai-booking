/**
 * ============================================================
 * CouponInput — debounced live coupon validator
 * ============================================================
 *
 * Hits POST /api/coupons/validate as the user types (debounced
 * 400ms). Surfaces three states:
 *   - empty:   neutral input
 *   - checking: spinner + "กำลังตรวจสอบ..."
 *   - valid:    green tick, discount summary, "applied"
 *   - invalid:  red, error message
 *
 * Parent receives the resolved coupon (or null) via onChange,
 * so it can recompute the order total. Designed to drop into
 * the booking form, checkout page, and the price-breakdown
 * panel introduced in Phase 11.
 * ============================================================
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Tag, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatCurrency } from '@chiangrai/shared/utils'

export type CouponBookingType = 'HOTEL' | 'CAR' | 'COMBO'

export interface AppliedCoupon {
  code: string
  description?: string | null
  discount_type: 'PERCENT' | 'FIXED'
  discount_value: number
  max_discount?: number | null
  applies_to: 'ALL' | 'HOTEL' | 'CAR'
  /** Computed by the backend for the supplied total_price. */
  discountAmount: number
  /** Computed by the backend (totalPrice - discountAmount). */
  finalAmount: number
}

interface CouponInputProps {
  bookingType: CouponBookingType
  totalPrice: number
  onChange?: (coupon: AppliedCoupon | null) => void
  /** Pre-fill (e.g. URL query param). */
  initialCode?: string
}

type Status = 'idle' | 'checking' | 'valid' | 'invalid'

export default function CouponInput({
  bookingType,
  totalPrice,
  onChange,
  initialCode = '',
}: CouponInputProps) {
  const [code, setCode] = useState(initialCode)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('')
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const reqIdRef = useRef(0)

  // Re-run validation when total price changes (e.g. user changed dates) —
  // a coupon valid at ฿8,000 may fail min_spend at ฿2,000.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = code.trim()
    if (!trimmed) {
      setStatus('idle')
      setCoupon(null)
      setMessage('')
      onChange?.(null)
      return
    }
    setStatus('checking')
    const reqId = ++reqIdRef.current
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch('/api/coupons/validate', {
          method: 'POST',
          body: { code: trimmed, booking_type: bookingType, total_price: totalPrice },
        })
        const data = (await res.json().catch(() => ({}))) as {
          valid?: boolean
          error?: string
          coupon?: Omit<AppliedCoupon, 'discountAmount' | 'finalAmount'>
          discount_amount?: number
          final_amount?: number
        }
        if (reqId !== reqIdRef.current) return // outdated response

        if (data.valid && data.coupon) {
          const applied: AppliedCoupon = {
            ...data.coupon,
            discountAmount: data.discount_amount || 0,
            finalAmount: data.final_amount || totalPrice,
          }
          setCoupon(applied)
          setStatus('valid')
          setMessage('')
          onChange?.(applied)
        } else {
          setCoupon(null)
          setStatus('invalid')
          setMessage(data.error || 'โค้ดคูปองไม่ถูกต้อง')
          onChange?.(null)
        }
      } catch {
        setCoupon(null)
        setStatus('invalid')
        setMessage('ตรวจสอบโค้ดไม่ได้ กรุณาลองใหม่')
        onChange?.(null)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [code, bookingType, totalPrice, onChange])

  const ringColor =
    status === 'valid'
      ? 'border-emerald-300 focus-within:border-emerald-400'
      : status === 'invalid'
        ? 'border-red-300 focus-within:border-red-400'
        : 'border-slate-200 focus-within:border-slate-500'

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${ringColor} bg-white transition-colors`}
      >
        <Tag
          size={16}
          className={
            status === 'valid'
              ? 'text-emerald-500'
              : status === 'invalid'
                ? 'text-red-500'
                : 'text-slate-400'
          }
        />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="โค้ดคูปอง (ถ้ามี)"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-transparent outline-none text-sm tracking-wider uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400"
        />
        {status === 'checking' && <Loader2 size={16} className="animate-spin text-slate-400" />}
        {status === 'valid' && <CheckCircle2 size={16} className="text-emerald-500" />}
        {status === 'invalid' && <AlertCircle size={16} className="text-red-500" />}
      </div>

      {/* Feedback row */}
      {status === 'valid' && coupon && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-800 flex items-center justify-between gap-2"
        >
          <span className="font-semibold">
            ใช้โค้ด {coupon.code} — ลด {formatCurrency(coupon.discountAmount)}
          </span>
          <span className="text-emerald-700">
            ยอดสุทธิ {formatCurrency(coupon.finalAmount)}
          </span>
        </div>
      )}
      {status === 'invalid' && message && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700"
        >
          {message}
        </div>
      )}
    </div>
  )
}
