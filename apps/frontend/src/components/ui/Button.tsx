/**
 * ============================================================
 * Button Component - ปุ่มกดที่ใช้ทั่วทั้งแอป
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ปุ่มกดที่มีหลายรูปแบบ (variant) และขนาด (size)
 *   - รองรับสถานะ loading พร้อม animation
 *   - รองรับ forwardRef สำหรับการเข้าถึง DOM
 *
 * Variants:
 *   - primary: ปุ่มหลัก (สีม่วง)
 *   - secondary: ปุ่มรอง (สีเทา)
 *   - outline: ปุ่มขอบ (โปร่งใส)
 *   - ghost: ปุ่มโปร่งใส
 *   - danger: ปุ่มอันตราย (สีแดง)
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@chiangrai/shared/utils'
import { Loader2 } from 'lucide-react'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Props สำหรับ Button component
 * @extends ButtonHTMLAttributes - รับ props ทั้งหมดของ HTML button
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** รูปแบบของปุ่ม */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  /** ขนาดของปุ่ม */
  size?: 'sm' | 'md' | 'lg'
  /** สถานะกำลังโหลด - แสดง spinner และ disable ปุ่ม */
  loading?: boolean
}

// ============================================================
// Component Definition
// ============================================================

/**
 * Button component ที่รองรับหลายรูปแบบและขนาด
 *
 * @description ปุ่มกดที่ใช้ทั่วทั้งแอป มีหลายรูปแบบ
 *              รองรับสถานะ loading พร้อม animation หมุน
 *              ปุ่มจะถูก disable เมื่อ loading หรือ disabled
 *
 * @param props - ButtonProps
 * @param ref - Ref สำหรับ button element
 * @returns Button element
 *
 * @example
 * // ปุ่มหลัก
 * <Button variant="primary">บันทึก</Button>
 *
 * // ปุ่มพร้อม loading
 * <Button loading>กำลังบันทึก...</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    // ----------------------------------------------------------
    // Styles (กำหนด Styles)
    // ----------------------------------------------------------

    /** สไตล์พื้นฐานสำหรับทุกปุ่ม */
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation min-h-[44px] sm:min-h-0'

    /** สไตล์ตามรูปแบบ (variant) */
    const variants = {
      /** ปุ่มหลัก - สีม่วงเข้มพร้อมเงา */
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100',
      /** ปุ่มรอง - สีเทาอ่อน */
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
      /** ปุ่มขอบ - มีเฉพาะขอบ */
      outline: 'border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600',
      /** ปุ่มโปร่งใส - ไม่มีพื้นหลัง */
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      /** ปุ่มอันตราย - สีแดงพร้อมเงา */
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100',
    }

    /** ขนาดปุ่มตาม size prop */
    const sizes = {
      /** ปุ่มเล็ก */
      sm: 'px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm',
      /** ปุ่มปกติ */
      md: 'px-4 sm:px-6 py-2.5 sm:py-3 text-sm',
      /** ปุ่มใหญ่ */
      lg: 'px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base',
    }

    // ----------------------------------------------------------
    // Render
    // ----------------------------------------------------------

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {/* แสดง spinner เมื่อ loading */}
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    )
  }
)

/** ชื่อ component สำหรับ DevTools */
Button.displayName = 'Button'

// ============================================================
// Export
// ============================================================

export default Button
