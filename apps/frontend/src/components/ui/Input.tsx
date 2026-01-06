/**
 * ============================================================
 * Input Component - ช่องกรอกข้อมูลที่ใช้ทั่วทั้งแอป
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ช่องกรอกข้อมูลพื้นฐานพร้อม label และ error
 *   - รองรับการแสดง/ซ่อนรหัสผ่าน
 *   - รองรับ forwardRef สำหรับ form libraries
 *
 * คุณสมบัติ:
 *   - label: ป้ายชื่อด้านบน
 *   - error: ข้อความ error ด้านล่าง
 *   - ปุ่มแสดง/ซ่อนรหัสผ่านอัตโนมัติ
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@chiangrai/shared/utils'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Props สำหรับ Input component
 * @extends InputHTMLAttributes - รับ props ทั้งหมดของ HTML input
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** ป้ายชื่อด้านบน input */
  label?: string
  /** ข้อความ error ด้านล่าง input */
  error?: string
}

// ============================================================
// Component Definition
// ============================================================

/**
 * Input component ที่รองรับ label และ error message
 *
 * @description ช่องกรอกข้อมูลพื้นฐานที่ใช้ทั่วทั้งแอป
 *              ถ้า type เป็น password จะแสดงปุ่มเปิด/ปิดตาอัตโนมัติ
 *              รองรับการแสดง error message สีแดงด้านล่าง
 *
 * @param props - InputProps
 * @param ref - Ref สำหรับ input element
 * @returns Input element พร้อม label และ error (ถ้ามี)
 *
 * @example
 * // Input ปกติ
 * <Input label="ชื่อ" placeholder="กรอกชื่อ" />
 *
 * // Input พร้อม error
 * <Input label="อีเมล" error="อีเมลไม่ถูกต้อง" />
 *
 * // Input รหัสผ่าน (มีปุ่มแสดง/ซ่อนอัตโนมัติ)
 * <Input type="password" label="รหัสผ่าน" />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    // ----------------------------------------------------------
    // State
    // ----------------------------------------------------------

    /** สถานะแสดง/ซ่อนรหัสผ่าน */
    const [showPassword, setShowPassword] = useState(false)

    /** ตรวจสอบว่าเป็น input รหัสผ่านหรือไม่ */
    const isPassword = type === 'password'

    // ----------------------------------------------------------
    // Render
    // ----------------------------------------------------------

    return (
      <div className="w-full">
        {/* Label ด้านบน */}
        {label && (
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
            {label}
          </label>
        )}

        {/* Input wrapper (สำหรับ password toggle button) */}
        <div className="relative">
          <input
            ref={ref}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              // สไตล์พื้นฐาน
              'w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white text-sm sm:text-base text-slate-900 placeholder:text-slate-400',
              // สไตล์ focus และ hover
              'focus:border-indigo-500 hover:border-slate-300 transition-all duration-200',
              // เพิ่ม padding ขวาถ้าเป็น password (สำหรับปุ่มตา)
              isPassword && 'pr-10 sm:pr-12',
              // สไตล์ error
              error && 'border-red-500 focus:border-red-500',
              className
            )}
            {...props}
          />

          {/* ปุ่มแสดง/ซ่อนรหัสผ่าน */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-1 text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          )}
        </div>

        {/* ข้อความ Error */}
        {error && (
          <p className="mt-1 text-xs sm:text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

/** ชื่อ component สำหรับ DevTools */
Input.displayName = 'Input'

// ============================================================
// Export
// ============================================================

export default Input
