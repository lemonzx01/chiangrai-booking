/**
 * ============================================================
 * useLocalize Hook - จัดการข้อมูลหลายภาษา
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ดึงข้อมูลตามภาษาปัจจุบัน (ไทย/อังกฤษ)
 *   - รองรับทั้ง object แบบ { th, en } และ flat object (name_th, name_en)
 *
 * การใช้งาน:
 *   - localize(): แปลง { th, en } object เป็นค่าตามภาษา
 *   - getField(): ดึง field จาก flat object (เช่น name_th)
 *   - getArrayField(): ดึง array field จาก flat object
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Type สำหรับค่าที่มี 2 ภาษา
 * @template T - ประเภทของค่า (string, number, etc.)
 */
type LocalizedValue<T> = {
  /** ค่าภาษาไทย */
  th: T
  /** ค่าภาษาอังกฤษ */
  en: T
}

// ============================================================
// Hook Definition
// ============================================================

/**
 * Hook สำหรับจัดการข้อมูลหลายภาษา
 *
 * @description ให้ฟังก์ชันสำหรับดึงข้อมูลตามภาษาปัจจุบัน
 *              รองรับทั้ง object แบบ { th, en } และ flat object
 *
 * @returns Object ที่มี:
 *          - localize: ฟังก์ชันแปลง { th, en } เป็นค่าตามภาษา
 *          - getField: ฟังก์ชันดึง field จาก flat object
 *          - getArrayField: ฟังก์ชันดึง array field จาก flat object
 *          - lang: ภาษาปัจจุบัน ('th' หรือ 'en')
 *
 * @example
 * const { localize, getField, lang } = useLocalize()
 *
 * // ใช้กับ { th, en } object
 * const title = localize({ th: 'สวัสดี', en: 'Hello' })
 *
 * // ใช้กับ flat object (เช่น Hotel)
 * const name = getField(hotel, 'name') // ได้ hotel.name_th หรือ hotel.name_en
 */
export function useLocalize() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------

  const { i18n } = useTranslation()

  /** ภาษาปัจจุบัน - ค่าเริ่มต้นเป็นภาษาไทย */
  const lang = (i18n.language || 'th') as 'th' | 'en'

  // ----------------------------------------------------------
  // Localize Function (แปลงค่าตามภาษา)
  // ----------------------------------------------------------

  /**
   * แปลง LocalizedValue เป็นค่าตามภาษาปัจจุบัน
   *
   * @description ตรวจสอบว่า value เป็น object ที่มี th และ en หรือไม่
   *              ถ้าใช่ จะคืนค่าตามภาษาปัจจุบัน
   *              ถ้าไม่ใช่ จะคืนค่าเดิม
   *
   * @param value - ค่าที่อาจเป็น LocalizedValue หรือค่าปกติ
   * @returns ค่าตามภาษาปัจจุบัน
   */
  const localize = useCallback(
    <T>(value: LocalizedValue<T> | T): T => {
      // ตรวจสอบว่าเป็น LocalizedValue หรือไม่
      if (
        value !== null &&
        typeof value === 'object' &&
        'th' in value &&
        'en' in value
      ) {
        // คืนค่าตามภาษาปัจจุบัน
        return (value as LocalizedValue<T>)[lang]
      }
      // คืนค่าเดิมถ้าไม่ใช่ LocalizedValue
      return value as T
    },
    [lang]
  )

  // ----------------------------------------------------------
  // Get Field Function (ดึง field จาก flat object)
  // ----------------------------------------------------------

  /**
   * ดึง field ตามภาษาจาก flat object
   *
   * @description ใช้สำหรับ object ที่มี fields แบบ field_th, field_en
   *              เช่น Hotel ที่มี name_th, name_en
   *
   * @param obj - Object ที่มี localized fields
   * @param field - ชื่อ field (ไม่รวม suffix _th/_en)
   * @returns ค่าของ field ตามภาษาปัจจุบัน
   *
   * @example
   * const hotel = { name_th: 'โรงแรม', name_en: 'Hotel' }
   * getField(hotel, 'name') // 'โรงแรม' (ถ้าภาษาไทย)
   */
  const getField = useCallback(
    (obj: object, field: string): string => {
      // สร้าง key ตามภาษาปัจจุบัน (เช่น name_th)
      const key = `${field}_${lang}`
      return (obj as Record<string, string>)[key] || ''
    },
    [lang]
  )

  // ----------------------------------------------------------
  // Get Array Field Function (ดึง array field จาก flat object)
  // ----------------------------------------------------------

  /**
   * ดึง array field ตามภาษาจาก flat object
   *
   * @description ใช้สำหรับ object ที่มี array fields แบบ field_th, field_en
   *              เช่น Hotel ที่มี amenities_th, amenities_en
   *
   * @param obj - Object ที่มี localized array fields
   * @param field - ชื่อ field (ไม่รวม suffix _th/_en)
   * @returns Array ของค่าตามภาษาปัจจุบัน
   *
   * @example
   * const hotel = { amenities_th: ['สระน้ำ'], amenities_en: ['Pool'] }
   * getArrayField(hotel, 'amenities') // ['สระน้ำ'] (ถ้าภาษาไทย)
   */
  const getArrayField = useCallback(
    (obj: object, field: string): string[] => {
      // สร้าง key ตามภาษาปัจจุบัน
      const key = `${field}_${lang}`
      return (obj as Record<string, string[]>)[key] || []
    },
    [lang]
  )

  // ----------------------------------------------------------
  // Return
  // ----------------------------------------------------------

  return { localize, getField, getArrayField, lang }
}

export default useLocalize
