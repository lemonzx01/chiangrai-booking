/**
 * ============================================================
 * I18nProvider - Component สำหรับ Wrap ระบบหลายภาษา
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ให้ context สำหรับ i18next ทั่วทั้งแอป
 *   - จัดการ hydration mismatch ระหว่าง server/client
 *   - โหลดภาษาที่ผู้ใช้เลือกจาก localStorage
 *
 * การใช้งาน:
 *   - ใช้ wrap รอบ children ใน root layout
 *   - ให้ useTranslation hook ทำงานได้ทั่วทั้งแอป
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { ReactNode, useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './index'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Props สำหรับ I18nProvider
 */
interface I18nProviderProps {
  /** Component ลูกที่จะถูก wrap ด้วย i18n context */
  children: ReactNode
}

// ============================================================
// Component Definition
// ============================================================

/**
 * Provider component สำหรับระบบหลายภาษา
 *
 * @description ให้ i18n context แก่ทุก component ในแอป
 *              จัดการ hydration mismatch โดยรอให้ client mount ก่อน
 *              แล้วจึงโหลดภาษาที่บันทึกไว้จาก localStorage
 *
 * @param props - Props ที่มี children
 * @returns I18nextProvider ที่ wrap children หรือ children เปล่าๆ (SSR)
 *
 * @example
 * // ใช้ใน root layout
 * <I18nProvider>
 *   <App />
 * </I18nProvider>
 */
export default function I18nProvider({ children }: I18nProviderProps) {
  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  /**
   * ตรวจสอบว่าอยู่ใน client หรือไม่
   * ใช้ป้องกัน hydration mismatch
   */
  const [isClient, setIsClient] = useState(false)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------

  /**
   * Effect สำหรับจัดการ client-side logic
   *
   * ทำงานเมื่อ:
   *   1. Component mount บน client
   *
   * การทำงาน:
   *   1. ตั้ง isClient เป็น true
   *   2. ดึงภาษาที่บันทึกไว้จาก localStorage
   *   3. ถ้ามีและต่างจากภาษาปัจจุบัน ให้เปลี่ยนภาษา
   */
  useEffect(() => {
    // บอกว่าตอนนี้อยู่ใน client แล้ว
    setIsClient(true)

    // ดึงภาษาที่ผู้ใช้เลือกไว้จาก localStorage
    const savedLng = localStorage.getItem('lng')

    // ถ้ามีภาษาที่บันทึกไว้ และต่างจากภาษาปัจจุบัน
    if (savedLng && savedLng !== i18n.language) {
      // เปลี่ยนไปใช้ภาษาที่บันทึกไว้
      i18n.changeLanguage(savedLng)
    }
  }, [])

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  /**
   * ป้องกัน hydration mismatch
   *
   * ระหว่าง SSR จะ render children เปล่าๆ
   * เมื่อ client mount แล้วจึง wrap ด้วย I18nextProvider
   */
  if (!isClient) {
    // Server-side: render children โดยไม่มี provider
    // ใช้ภาษาเริ่มต้น (ไทย) จาก i18n config
    return <>{children}</>
  }

  // Client-side: render พร้อม I18nextProvider
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
