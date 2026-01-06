/**
 * ============================================================
 * Skeleton Component - Placeholder สำหรับ Loading State
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดง placeholder ขณะรอโหลดข้อมูล
 *   - มี shimmer animation สำหรับ loading effect
 *   - รองรับ forwardRef
 *
 * การใช้งาน:
 *   - ใช้แทนที่เนื้อหาจริงขณะโหลด
 *   - กำหนดขนาดผ่าน className
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
 * Props สำหรับ Skeleton component
 * @extends HTMLAttributes - รับ props ทั้งหมดของ HTML div
 */
interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

// ============================================================
// Component Definition
// ============================================================

/**
 * Skeleton component สำหรับ loading placeholder
 *
 * @description แสดงกล่องสีเทาพร้อม shimmer animation
 *              ใช้แทนที่เนื้อหาขณะรอโหลดข้อมูล
 *              ต้องกำหนดขนาดผ่าน className เช่น "h-4 w-32"
 *
 * @param props - SkeletonProps
 * @param ref - Ref สำหรับ div element
 * @returns Skeleton element
 *
 * @example
 * // Skeleton สำหรับข้อความ
 * <Skeleton className="h-4 w-32" />
 *
 * // Skeleton สำหรับรูปภาพ
 * <Skeleton className="h-48 w-full rounded-xl" />
 *
 * // Skeleton สำหรับ Avatar
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // สไตล์พื้นฐาน: shimmer animation สีเทา โค้งมน
          'animate-shimmer rounded-lg bg-slate-200',
          className
        )}
        {...props}
      />
    )
  }
)

/** ชื่อ component สำหรับ DevTools */
Skeleton.displayName = 'Skeleton'

// ============================================================
// Export
// ============================================================

export default Skeleton
