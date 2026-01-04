/**
 * ============================================================
 * CustomSelect Component - Dropdown เลือกตัวเลือก
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - Dropdown สำหรับเลือกตัวเลือกต่างๆ
 *   - มี animation เมื่อเปิด/ปิด
 *   - ปิดอัตโนมัติเมื่อคลิกด้านนอก
 *
 * คุณสมบัติ:
 *   - รองรับ options หลายตัว
 *   - แสดง icon MapPin หน้าตัวเลือก
 *   - Highlight ตัวเลือกที่เลือก
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Interface สำหรับตัวเลือกแต่ละตัว
 */
interface Option {
  /** ค่าที่จะส่งกลับเมื่อเลือก */
  value: string
  /** ข้อความที่แสดง */
  label: string
  /** รหัสเพิ่มเติม (ไม่บังคับ) */
  code?: string
}

/**
 * Props สำหรับ CustomSelect component
 */
interface CustomSelectProps {
  /** ค่าปัจจุบัน */
  value: string
  /** Callback เมื่อเลือกตัวเลือก */
  onChange: (value: string) => void
  /** รายการตัวเลือก */
  options: Option[]
  /** ข้อความ placeholder */
  placeholder?: string
  /** CSS class เพิ่มเติม */
  className?: string
}

// ============================================================
// Component Definition
// ============================================================

/**
 * CustomSelect component
 *
 * @description Dropdown สำหรับเลือกตัวเลือก
 *              ปิดอัตโนมัติเมื่อคลิกด้านนอก
 *              มี animation scale-up เมื่อเปิด
 *
 * @param props - CustomSelectProps
 * @returns Select dropdown component
 *
 * @example
 * <CustomSelect
 *   value={selectedProvince}
 *   onChange={setSelectedProvince}
 *   options={provinces}
 *   placeholder="เลือกจังหวัด"
 * />
 */
export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
}: CustomSelectProps) {
  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  /** สถานะเปิด/ปิด dropdown */
  const [isOpen, setIsOpen] = useState(false)

  // ----------------------------------------------------------
  // Refs
  // ----------------------------------------------------------

  /** Ref สำหรับ container element (ใช้ตรวจจับ click outside) */
  const selectRef = useRef<HTMLDivElement>(null)

  // ----------------------------------------------------------
  // Computed Values
  // ----------------------------------------------------------

  /** หา option ที่ตรงกับ value ปัจจุบัน */
  const selectedOption = options.find((opt) => opt.value === value)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------

  /**
   * ปิด dropdown เมื่อคลิกด้านนอก
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* ปุ่มเปิด Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-base text-slate-800 font-semibold bg-transparent outline-none cursor-pointer text-left"
      >
        <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
          {selectedOption?.label || placeholder}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full -left-12 mt-3 bg-white rounded-xl z-50 w-[240px] border-2 border-indigo-500 shadow-2xl overflow-hidden animate-scale-up">
          <div className="p-2">
            <div className="flex flex-col gap-1">
              {/* แสดงตัวเลือกทั้งหมด */}
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all ${
                    value === option.value
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {/* Icon หมุด */}
                  <MapPin
                    size={16}
                    className={`flex-shrink-0 ${
                      value === option.value ? 'text-white' : 'text-indigo-600'
                    }`}
                  />
                  {/* ข้อความตัวเลือก */}
                  <span className="text-sm font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
