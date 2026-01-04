/**
 * ============================================================
 * CustomDatePicker Component - ตัวเลือกวันที่แบบกำหนดเอง
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ตัวเลือกวันที่ที่รองรับหลายภาษา (ไทย/อังกฤษ)
 *   - แสดงปี พ.ศ. เมื่อเลือกภาษาไทย
 *   - มี custom header สำหรับเลือกเดือนและปี
 *
 * คุณสมบัติ:
 *   - รองรับ minDate สำหรับจำกัดวันที่เลือกได้
 *   - เลือกเดือน/ปีผ่าน dropdown
 *   - ปุ่มเลื่อนเดือน ซ้าย/ขวา
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { forwardRef, useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonth, getYear } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Locale } from 'date-fns'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Props สำหรับ CustomDatePicker component
 */
interface CustomDatePickerProps {
  /** วันที่ที่เลือก */
  value?: Date | null
  /** Callback เมื่อเลือกวันที่ */
  onChange: (date: Date | null) => void
  /** ข้อความ placeholder */
  placeholder?: string
  /** วันที่ต่ำสุดที่เลือกได้ */
  minDate?: Date
  /** Locale สำหรับ date-fns */
  locale?: Locale
}

// ============================================================
// CustomInput Sub-Component (ปุ่มแสดงค่า)
// ============================================================

/**
 * Custom input button สำหรับ DatePicker
 *
 * @description ปุ่มที่แสดงวันที่ที่เลือก หรือ placeholder
 *              ใช้แทน input element มาตรฐาน
 */
const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, placeholder }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    className="w-full text-base text-slate-800 font-semibold bg-transparent outline-none cursor-pointer text-left flex items-center gap-2"
  >
    <span className="flex-1">
      {value || <span className="text-slate-400 font-semibold">{placeholder}</span>}
    </span>
  </button>
))

/** ชื่อ component สำหรับ DevTools */
CustomInput.displayName = 'CustomInput'

// ============================================================
// Component Definition
// ============================================================

/**
 * CustomDatePicker component
 *
 * @description ตัวเลือกวันที่แบบกำหนดเองที่รองรับหลายภาษา
 *              มี custom header สำหรับเลือกเดือน/ปี
 *              แสดงปี พ.ศ. เมื่อใช้ภาษาไทย
 *
 * @param props - CustomDatePickerProps
 * @returns DatePicker component
 *
 * @example
 * <CustomDatePicker
 *   value={selectedDate}
 *   onChange={setSelectedDate}
 *   placeholder="เลือกวันเกิด"
 *   minDate={new Date()}
 * />
 */
const CustomDatePicker = ({
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  minDate,
  locale,
}: CustomDatePickerProps) => {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------

  const { i18n } = useTranslation()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  /** สถานะเปิด/ปิด popup */
  const [isOpen, setIsOpen] = useState(false)

  /** ตรวจสอบว่า component mount แล้วหรือไม่ (ป้องกัน hydration mismatch) */
  const [mounted, setMounted] = useState(false)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------

  /** ตั้ง mounted เป็น true เมื่อ component mount */
  useEffect(() => {
    setMounted(true)
  }, [])

  // ----------------------------------------------------------
  // Constants (ค่าคงที่)
  // ----------------------------------------------------------

  /** ภาษาปัจจุบัน - ใช้ 'th' ก่อน mount เพื่อป้องกัน hydration mismatch */
  const lang = mounted ? i18n.language : 'th'

  /** สร้าง array ของปี (100 ปี ย้อนหลัง 50 ปี และไปข้างหน้า 50 ปี) */
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i)

  /** ชื่อเดือนภาษาไทย */
  const monthsTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  /** ชื่อเดือนภาษาอังกฤษ */
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  /** เลือกชื่อเดือนตามภาษา */
  const months = lang === 'th' ? monthsTh : monthsEn

  // ----------------------------------------------------------
  // Handlers (ฟังก์ชันจัดการ Events)
  // ----------------------------------------------------------

  /**
   * จัดการเมื่อเลือกวันที่
   * ปิด popup และส่งค่าไปยัง parent
   */
  const handleDateSelect = (date: Date | null) => {
    onChange(date)
    setIsOpen(false)
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <DatePicker
      selected={value}
      onChange={handleDateSelect}
      open={isOpen}
      onInputClick={() => setIsOpen(true)}
      onClickOutside={() => setIsOpen(false)}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      minDate={minDate}
      locale={locale}
      customInput={<CustomInput />}
      showPopperArrow={false}
      popperPlacement="bottom-start"
      popperProps={{
        strategy: 'fixed',
      }}
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="flex items-center justify-between px-4 py-3">
          {/* ปุ่มเดือนก่อนหน้า */}
          <button
            type="button"
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} className="text-slate-600" />
          </button>

          {/* Dropdown เลือกเดือนและปี */}
          <div className="flex items-center gap-2">
            {/* Dropdown เดือน */}
            <select
              value={getMonth(date)}
              onChange={({ target: { value } }) => changeMonth(parseInt(value))}
              className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {months.map((month, i) => (
                <option key={month} value={i}>
                  {month}
                </option>
              ))}
            </select>

            {/* Dropdown ปี (แสดง พ.ศ. ถ้าเป็นภาษาไทย) */}
            <select
              value={getYear(date)}
              onChange={({ target: { value } }) => changeYear(parseInt(value))}
              className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {lang === 'th' ? year + 543 : year}
                </option>
              ))}
            </select>
          </div>

          {/* ปุ่มเดือนถัดไป */}
          <button
            type="button"
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>
      )}
    />
  )
}

// ============================================================
// Export
// ============================================================

export default CustomDatePicker
