/**
 * ============================================================
 * PriceBreakdown — itemized order summary
 * ============================================================
 *
 * Drop into any booking / checkout context. Accepts a list of
 * line items (label + amount), an optional discount object
 * (typically from CouponInput), and a base currency.
 *
 * Displays:
 *   - Subtotal (sum of items)
 *   - Discount line (negative, color-coded green)
 *   - Service fee line (label only — booking has none)
 *   - Total line (large, bold, indigo)
 *
 * Currency: pass formatted strings if you have multi-currency,
 * or just numbers and we'll format with formatCurrency.
 * ============================================================
 */

'use client'

import { type ReactNode } from 'react'
import { formatCurrency } from '@chiangrai/shared/utils'

export interface PriceLine {
  label: string
  amount: number
  /** Optional small note shown beneath the label (italic). */
  note?: string
  /** Hide this line if the value is 0 (default true). */
  hideIfZero?: boolean
}

interface PriceBreakdownProps {
  items: PriceLine[]
  /** Discount applied to the subtotal (positive number; will be subtracted). */
  discountAmount?: number
  /** Optional label for the discount line, e.g. "ส่วนลดคูปอง CR2025". */
  discountLabel?: string
  /** Optional service-fee tag — defaults to "ฟรี" with a green pill. */
  serviceFeeLabel?: string
  /** Optional override for the grand total label. */
  totalLabel?: string
  /** Extra footer content (e.g. "รวม VAT แล้ว"). */
  footer?: ReactNode
}

export default function PriceBreakdown({
  items,
  discountAmount = 0,
  discountLabel = 'ส่วนลด',
  serviceFeeLabel = 'ค่าบริการ',
  totalLabel = 'รวมที่ต้องชำระ',
  footer,
}: PriceBreakdownProps) {
  const subtotal = items.reduce((sum, i) => sum + (i.amount || 0), 0)
  const total = Math.max(0, subtotal - discountAmount)

  return (
    <div className="space-y-2.5 text-sm">
      {items.map((item, idx) => {
        if (item.hideIfZero !== false && (item.amount || 0) === 0) return null
        return (
          <div
            key={`${item.label}-${idx}`}
            className="flex items-baseline justify-between gap-3"
          >
            <div className="text-slate-600">
              <span>{item.label}</span>
              {item.note && (
                <span className="block text-[11px] italic text-slate-400 mt-0.5">
                  {item.note}
                </span>
              )}
            </div>
            <span className="font-medium text-slate-700 whitespace-nowrap">
              {formatCurrency(item.amount)}
            </span>
          </div>
        )
      })}

      <div className="flex items-center justify-between text-slate-500">
        <span>{serviceFeeLabel}</span>
        <span className="text-green-600 font-medium text-xs px-2 py-0.5 rounded-full bg-green-50">
          ฟรี
        </span>
      </div>

      {discountAmount > 0 && (
        <div className="flex items-center justify-between text-emerald-700">
          <span className="font-medium">{discountLabel}</span>
          <span className="font-semibold">−{formatCurrency(discountAmount)}</span>
        </div>
      )}

      <div className="border-t border-slate-200 pt-3 mt-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900">{totalLabel}</span>
          <span className="font-semibold text-xl text-slate-900">
            {formatCurrency(total)}
          </span>
        </div>
        {footer && <div className="mt-1 text-[11px] text-slate-400 text-right">{footer}</div>}
      </div>
    </div>
  )
}
