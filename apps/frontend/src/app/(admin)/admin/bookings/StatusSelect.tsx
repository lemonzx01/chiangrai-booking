/**
 * ============================================================
 * Booking Status Select - Custom Dropdown เปลี่ยนสถานะการจอง
 * ============================================================
 */

'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { VALID_STATUS_TRANSITIONS } from '@chiangrai/shared/types'

// ============================================================
// Constants
// ============================================================

const statusOptions = [
  { value: 'PENDING', label: 'รอดำเนินการ', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  { value: 'CONFIRMED', label: 'ยืนยันแล้ว', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  { value: 'PAID', label: 'ชำระเงินแล้ว', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  { value: 'CANCELLED', label: 'ยกเลิก', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
]

// ============================================================
// Component
// ============================================================

interface BookingStatusSelectProps {
  bookingCode: string
  currentStatus: string
}

export default function BookingStatusSelect({ bookingCode, currentStatus }: BookingStatusSelectProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setOpen(false)
      return
    }

    setOpen(false)

    // Cancel flow
    if (newStatus === 'CANCELLED') {
      const confirmed = window.confirm('ต้องการยกเลิกการจองนี้หรือไม่?')
      if (!confirmed) return

      setLoading(true)
      try {
        const res = await fetch(`/api/bookings/${bookingCode}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'ยกเลิกโดย Admin' }),
        })
        if (res.ok) {
          router.refresh()
        } else {
          const data = await res.json().catch(() => ({}))
          alert(data.error || 'ไม่สามารถยกเลิกได้')
        }
      } catch {
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
      } finally {
        setLoading(false)
      }
      return
    }

    // Normal status update
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'ไม่สามารถอัปเดตสถานะได้')
      }
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const currentOption = statusOptions.find(s => s.value === currentStatus)
  const allowedValues = VALID_STATUS_TRANSITIONS[currentStatus] || []
  const availableOptions = statusOptions.filter(
    opt => opt.value !== currentStatus && allowedValues.includes(opt.value)
  )
  const hasOptions = availableOptions.length > 0

  return (
    <div ref={ref} className="relative inline-block">
      {/* Current Status Badge */}
      <button
        type="button"
        onClick={() => hasOptions && !loading && setOpen(!open)}
        disabled={!hasOptions || loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          currentOption?.bg || 'bg-gray-100'
        } ${currentOption?.text || 'text-gray-700'} ${
          hasOptions && !loading ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
        }`}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <span className={`w-2 h-2 rounded-full ${currentOption?.dot || 'bg-gray-500'}`} />
        )}
        <span>{currentOption?.label || currentStatus}</span>
        {hasOptions && !loading && (
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-[160px] animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            เปลี่ยนสถานะเป็น
          </div>
          {availableOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange(option.value)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${option.dot}`} />
              <span className={`font-medium ${option.text}`}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
