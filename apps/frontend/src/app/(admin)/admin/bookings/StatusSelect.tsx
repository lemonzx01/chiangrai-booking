/**
 * ============================================================
 * Booking Status Select - Dropdown เปลี่ยนสถานะการจอง (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดง Dropdown เลือกสถานะการจอง
 *   - อัปเดตสถานะผ่าน API เมื่อเปลี่ยน
 *   - แสดงสีตามสถานะ
 *
 * การใช้งาน:
 *   <BookingStatusSelect
 *     bookingCode="BK-123456"
 *     currentStatus="PENDING"
 *   />
 *
 * Features:
 *   - สถานะ: PENDING, CONFIRMED, PAID, CANCELLED, COMPLETED
 *   - สีตามสถานะ (เหลือง, น้ำเงิน, เขียว, แดง, เทา)
 *   - Loading state ขณะอัปเดต
 *   - Auto refresh หลังอัปเดตสำเร็จ
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Next.js hooks สำหรับ navigation */
import { useRouter } from 'next/navigation'

/** React hooks สำหรับจัดการ state */
import { useState } from 'react'

/** Status transition rules */
import { VALID_STATUS_TRANSITIONS } from '@chiangrai/shared/types'

// ============================================================
// Constants
// ============================================================

/**
 * ตัวเลือกสถานะการจอง
 * แต่ละสถานะมี: value, label (ภาษาไทย), color (CSS classes)
 */
const statusOptions = [
  { value: 'PENDING', label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'CONFIRMED', label: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-700' },
  { value: 'PAID', label: 'ชำระเงินแล้ว', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
  { value: 'COMPLETED', label: 'เสร็จสิ้น', color: 'bg-gray-100 text-gray-700' },
]

// ============================================================
// Component Props
// ============================================================

/**
 * Props สำหรับ BookingStatusSelect
 */
interface BookingStatusSelectProps {
  /** รหัสการจอง */
  bookingCode: string
  /** สถานะปัจจุบัน */
  currentStatus: string
}

// ============================================================
// Main Component
// ============================================================

/**
 * Dropdown เลือกสถานะการจอง
 *
 * @description
 *   แสดง dropdown พร้อมสีตามสถานะ
 *   เมื่อเปลี่ยนสถานะจะเรียก API อัปเดต
 *
 * @param {BookingStatusSelectProps} props - Props ของ component
 * @returns {JSX.Element} Status select dropdown UI
 */
export default function BookingStatusSelect({ bookingCode, currentStatus }: BookingStatusSelectProps) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ navigation และ refresh */
  const router = useRouter()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(false)

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการเปลี่ยนสถานะ
   *
   * ขั้นตอน:
   * 1. ตรวจสอบว่าเปลี่ยนจริงหรือไม่
   * 2. เรียก API PATCH /api/bookings/:bookingCode
   * 3. Refresh หน้าเมื่อสำเร็จ หรือแสดง error
   *
   * @param {string} newStatus - สถานะใหม่ที่เลือก
   */
  const handleChange = async (newStatus: string) => {
    // ถ้าสถานะเหมือนเดิม ไม่ต้องทำอะไร
    if (newStatus === currentStatus) return

    // ถ้าเลือก CANCELLED ให้ใช้ cancel endpoint แทน
    if (newStatus === 'CANCELLED') {
      const confirmed = window.confirm('ต้องการยกเลิกการจองนี้หรือไม่? (ถ้ามีการชำระเงินแล้ว ระบบจะคืนเงินตามนโยบาย)')
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
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      // ----------------------------------------------------------
      // เรียก API เพื่ออัปเดตสถานะ
      // ----------------------------------------------------------
      const res = await fetch(`/api/bookings/${bookingCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        // อัปเดตสำเร็จ -> refresh หน้า
        router.refresh()
      } else {
        // อัปเดตไม่สำเร็จ -> แสดง error
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------------------------
  // Derived Values
  // ----------------------------------------------------------
  /** หาตัวเลือกปัจจุบันเพื่อใช้สี */
  const currentOption = statusOptions.find(s => s.value === currentStatus)

  /** กรองตัวเลือกตาม valid transitions */
  const allowedValues = VALID_STATUS_TRANSITIONS[currentStatus] || []
  const availableOptions = statusOptions.filter(
    opt => opt.value === currentStatus || allowedValues.includes(opt.value)
  )

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <select
      value={currentStatus}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading || allowedValues.length === 0}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
        currentOption?.color || 'bg-gray-100 text-gray-700'
      } ${loading ? 'opacity-50' : ''}`}
    >
      {/* แสดงเฉพาะตัวเลือกที่เปลี่ยนได้ */}
      {availableOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
