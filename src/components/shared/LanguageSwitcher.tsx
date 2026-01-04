/**
 * ============================================================
 * LanguageSwitcher Component - ปุ่มสลับภาษา
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ให้ผู้ใช้สลับระหว่างภาษาไทยและอังกฤษ
 *   - บันทึกภาษาที่เลือกลง localStorage
 *
 * คุณสมบัติ:
 *   - รองรับ 2 โหมด: light (พื้นหลังสว่าง) และ dark (พื้นหลังเข้ม)
 *   - ป้องกัน hydration mismatch
 *   - แสดงสถานะ active ของภาษาปัจจุบัน
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Props สำหรับ LanguageSwitcher component
 */
interface Props {
  /** โหมดสีอ่อน (true) หรือสีเข้ม (false) */
  light?: boolean
}

// ============================================================
// Component Definition
// ============================================================

/**
 * LanguageSwitcher component
 *
 * @description ปุ่มสลับภาษาระหว่าง TH และ EN
 *              บันทึกภาษาที่เลือกลง localStorage
 *              รองรับ 2 โหมดสี
 *
 * @param props - Props ที่มี light option
 * @returns ปุ่มสลับภาษา
 *
 * @example
 * // ใช้บน navbar พื้นหลังขาว
 * <LanguageSwitcher light={true} />
 *
 * // ใช้บน navbar โปร่งใส
 * <LanguageSwitcher light={false} />
 */
export default function LanguageSwitcher({ light = true }: Props) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------

  const { i18n } = useTranslation()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  /** ตรวจสอบว่า component mount แล้ว (ป้องกัน hydration mismatch) */
  const [mounted, setMounted] = useState(false)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------

  /** ตั้ง mounted เป็น true เมื่อ component mount */
  useEffect(() => {
    setMounted(true)
  }, [])

  // ----------------------------------------------------------
  // Computed Values
  // ----------------------------------------------------------

  /** ภาษาปัจจุบัน - ใช้ 'th' ก่อน mount เพื่อป้องกัน hydration mismatch */
  const currentLanguage = mounted ? i18n.language : 'th'

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------

  /**
   * เปลี่ยนภาษาและบันทึกลง localStorage
   * @param lng - รหัสภาษา ('th' หรือ 'en')
   */
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('lng', lng)
  }

  // ----------------------------------------------------------
  // Styles
  // ----------------------------------------------------------

  /** สไตล์สำหรับปุ่มที่ไม่ active */
  const baseInactive = light
    ? 'text-slate-500 hover:text-indigo-600'
    : 'text-white/80 hover:text-white'

  /** สไตล์สำหรับปุ่มที่ active */
  const activeClass = light ? 'text-indigo-600 font-bold' : 'text-white font-bold'

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="flex items-center space-x-2 select-none">
      {/* ปุ่มภาษาไทย */}
      <button
        onClick={() => changeLanguage('th')}
        className={`px-1.5 py-0.5 rounded-md transition-colors ${
          currentLanguage === 'th' ? activeClass : baseInactive
        }`}
      >
        TH
      </button>

      {/* ตัวคั่น */}
      <span className={light ? 'text-slate-300' : 'text-white/40'}>|</span>

      {/* ปุ่มภาษาอังกฤษ */}
      <button
        onClick={() => changeLanguage('en')}
        className={`px-1.5 py-0.5 rounded-md transition-colors ${
          currentLanguage === 'en' ? activeClass : baseInactive
        }`}
      >
        EN
      </button>
    </div>
  )
}
