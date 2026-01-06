/**
 * ============================================================
 * Badge Component - ป้ายสถานะหรือหมวดหมู่
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงสถานะ หมวดหมู่ หรือ tag ต่างๆ
 *   - มีหลายสี (variant) ตามความหมาย
 *   - รองรับ forwardRef
 *
 * Variants:
 *   - default: สีเทา (ค่าเริ่มต้น)
 *   - success: สีเขียว (สำเร็จ)
 *   - warning: สีเหลือง (เตือน)
 *   - danger: สีแดง (อันตราย)
 *   - info: สีฟ้า (ข้อมูล)
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@chiangrai/shared/utils'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Props สำหรับ Badge component
 * @extends HTMLAttributes - รับ props ทั้งหมดของ HTML span
 */
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** รูปแบบสีของ badge */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

// ============================================================
// Component Definition
// ============================================================

/**
 * Badge component สำหรับแสดงสถานะหรือ tag
 *
 * @description ป้ายเล็กๆ สำหรับแสดงสถานะ หมวดหมู่ หรือ tag
 *              มีหลายสีตามความหมาย เช่น เขียว=สำเร็จ แดง=อันตราย
 *
 * @param props - BadgeProps
 * @param ref - Ref สำหรับ span element
 * @returns Badge element
 *
 * @example
 * <Badge variant="success">ชำระแล้ว</Badge>
 * <Badge variant="warning">รอยืนยัน</Badge>
 * <Badge variant="danger">ยกเลิก</Badge>
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    // ----------------------------------------------------------
    // Styles
    // ----------------------------------------------------------

    /** สไตล์ตาม variant */
    const variants = {
      /** สีเทา - ค่าเริ่มต้น */
      default: 'bg-slate-100 text-slate-700',
      /** สีเขียว - สำเร็จ/ยืนยันแล้ว */
      success: 'bg-green-100 text-green-700',
      /** สีเหลือง - รอดำเนินการ */
      warning: 'bg-yellow-100 text-yellow-700',
      /** สีแดง - ยกเลิก/ล้มเหลว */
      danger: 'bg-red-100 text-red-700',
      /** สีฟ้า - ข้อมูลทั่วไป */
      info: 'bg-blue-100 text-blue-700',
    }

    // ----------------------------------------------------------
    // Render
    // ----------------------------------------------------------

    return (
      <span
        ref={ref}
        className={cn(
          // สไตล์พื้นฐาน: ขนาดเล็ก โค้งมน font หนา
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
          // สไตล์ตาม variant
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

/** ชื่อ component สำหรับ DevTools */
Badge.displayName = 'Badge'

// ============================================================
// Export
// ============================================================

export default Badge
