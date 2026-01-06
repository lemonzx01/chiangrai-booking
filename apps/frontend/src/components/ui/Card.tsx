/**
 * ============================================================
 * Card Components - การ์ดและส่วนประกอบย่อย
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - การ์ดพื้นฐานสำหรับจัดกลุ่มเนื้อหา
 *   - มีส่วนประกอบย่อย: Header, Content, Footer
 *   - รองรับ hover effect
 *
 * Components:
 *   - Card: การ์ดหลัก
 *   - CardHeader: ส่วนหัวการ์ด
 *   - CardContent: ส่วนเนื้อหาการ์ด
 *   - CardFooter: ส่วนท้ายการ์ด
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
// Card Component (การ์ดหลัก)
// ============================================================

/**
 * Props สำหรับ Card component
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** เปิดใช้ hover effect (ยกขึ้นและมีเงา) */
  hover?: boolean
}

/**
 * Card component หลัก
 *
 * @description การ์ดพื้นฐานที่ใช้จัดกลุ่มเนื้อหา
 *              มีขอบโค้งมนและเงาเบาๆ
 *              รองรับ hover effect
 *
 * @param props - CardProps
 * @param ref - Ref สำหรับ div element
 * @returns Card element
 *
 * @example
 * <Card hover>
 *   <CardHeader>หัวข้อ</CardHeader>
 *   <CardContent>เนื้อหา</CardContent>
 *   <CardFooter>ท้าย</CardFooter>
 * </Card>
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // สไตล์พื้นฐาน: พื้นขาว ขอบโค้ง เงาเบา
          'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden',
          // hover effect: ยกขึ้นและเงาเข้มขึ้น
          hover && 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

/** ชื่อ component สำหรับ DevTools */
Card.displayName = 'Card'

// ============================================================
// CardHeader Component (ส่วนหัวการ์ด)
// ============================================================

/**
 * Props สำหรับ CardHeader component
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * CardHeader component
 *
 * @description ส่วนหัวของการ์ด มี padding รอบด้าน
 */
const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
)

/** ชื่อ component สำหรับ DevTools */
CardHeader.displayName = 'CardHeader'

// ============================================================
// CardContent Component (ส่วนเนื้อหาการ์ด)
// ============================================================

/**
 * Props สำหรับ CardContent component
 */
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * CardContent component
 *
 * @description ส่วนเนื้อหาหลักของการ์ด
 *              มี padding ซ้าย-ขวา และล่าง (ไม่มีบน)
 */
const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 pb-6', className)} {...props} />
  )
)

/** ชื่อ component สำหรับ DevTools */
CardContent.displayName = 'CardContent'

// ============================================================
// CardFooter Component (ส่วนท้ายการ์ด)
// ============================================================

/**
 * Props สำหรับ CardFooter component
 */
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * CardFooter component
 *
 * @description ส่วนท้ายของการ์ด สำหรับปุ่มหรือ action
 *              มี padding ซ้าย-ขวา และล่าง (ไม่มีบน)
 */
const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 pb-6 pt-0', className)} {...props} />
  )
)

/** ชื่อ component สำหรับ DevTools */
CardFooter.displayName = 'CardFooter'

// ============================================================
// Exports
// ============================================================

export { Card, CardHeader, CardContent, CardFooter }
export default Card
