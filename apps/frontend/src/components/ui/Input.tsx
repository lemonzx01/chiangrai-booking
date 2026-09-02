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

import { InputHTMLAttributes, forwardRef, useId, useState } from 'react'
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
  /** คำอธิบายเพิ่มเติมใต้ label (เช่น รูปแบบที่ต้องกรอก) */
  hint?: string
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
  ({ className, label, error, hint, type = 'text', id, ...props }, ref) => {
    // ----------------------------------------------------------
    // State
    // ----------------------------------------------------------

    /** สถานะแสดง/ซ่อนรหัสผ่าน */
    const [showPassword, setShowPassword] = useState(false)

    /** ตรวจสอบว่าเป็น input รหัสผ่านหรือไม่ */
    const isPassword = type === 'password'

    // ----------------------------------------------------------
    // Accessibility wiring
    // ----------------------------------------------------------
    // Every input needs a stable id so <label htmlFor> can point at
    // it. Without the association, clicking the label doesn't focus
    // the field and a screen reader announces the input as unlabelled
    // ("edit text, blank") — which makes the form unusable non-visually.
    // useId() is SSR-safe; a caller-supplied `id` still wins.
    const reactId = useId()
    const inputId = id ?? `input-${reactId}`
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    // Point the input at whichever descriptions actually rendered, so
    // the error/hint text is read out with the field instead of being
    // orphaned text that only sighted users can connect to it.
    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(' ')

    // ----------------------------------------------------------
    // Render
    // ----------------------------------------------------------

    return (
      <div className="w-full">
        {/* Label ด้านบน */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
          >
            {label}
            {/* Required marker. aria-hidden because `required` on the
                input already conveys this to assistive tech — the
                asterisk is the visual half of the same message. */}
            {props.required && (
              <span className="ml-0.5 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* คำอธิบายเพิ่มเติม (แสดงก่อน input เพื่อให้อ่านก่อนกรอก) */}
        {hint && !error && (
          <p id={hintId} className="mb-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )}

        {/* Input wrapper (สำหรับ password toggle button) */}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            // Announces the invalid state, so the field is flagged even
            // when the red border isn't perceivable.
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            className={cn(
              // สไตล์พื้นฐาน
              'w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white text-sm sm:text-base text-slate-900 placeholder:text-slate-400',
              // สไตล์ focus และ hover
              'focus:border-slate-900 hover:border-slate-300 transition-all duration-200',
              // Visible keyboard focus. A border colour change alone is
              // a ~1.3:1 shift against the resting border — below the
              // 3:1 WCAG 2.2 asks for a focus indicator — so pair it
              // with a ring.
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20',
              // เพิ่ม padding ขวาถ้าเป็น password (สำหรับปุ่มตา)
              isPassword && 'pr-10 sm:pr-12',
              // สไตล์ error
              error && 'border-red-500 focus:border-red-500 focus-visible:ring-red-500/25',
              className
            )}
            {...props}
          />

          {/* ปุ่มแสดง/ซ่อนรหัสผ่าน */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              // Was tabIndex={-1} with no label: keyboard users could
              // not reach the toggle at all, and screen readers read it
              // as an unnamed button. It is a real control, so it gets
              // a name, a pressed state, and a place in the tab order.
              aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              aria-pressed={showPassword}
              aria-controls={inputId}
              className={cn(
                'absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 sm:p-1',
                'text-slate-400 hover:text-slate-600 transition-colors touch-manipulation',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900'
              )}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* ข้อความ Error.
            role="alert" so a validation failure is announced when it
            appears, rather than silently rendering below a field the
            user has already tabbed past. text-red-600 (was 500) to
            clear 4.5:1 contrast on white. */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1 text-xs sm:text-sm text-red-600"
          >
            {error}
          </p>
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
