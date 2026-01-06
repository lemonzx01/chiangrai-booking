/**
 * ============================================================
 * Utils - ฟังก์ชันอรรถประโยชน์ทั่วไป
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - รวมฟังก์ชันอรรถประโยชน์ที่ใช้ทั่วทั้งโปรเจค
 *   - ฟังก์ชันสำหรับจัดรูปแบบข้อมูล (format)
 *   - ฟังก์ชันสำหรับตรวจสอบข้อมูล (validate)
 *   - ฟังก์ชันช่วยเหลืออื่นๆ (helpers)
 *
 * การทำงานหลัก:
 *   - cn(): รวม class names (Tailwind CSS)
 *   - formatCurrency(): จัดรูปแบบสกุลเงินบาท
 *   - formatDate(): จัดรูปแบบวันที่
 *   - calculateNights(): คำนวณจำนวนคืน
 *   - generateBookingCode(): สร้างรหัสการจอง
 *   - validatePassword(): ตรวจสอบความแข็งแรงรหัสผ่าน
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import { type ClassValue, clsx } from 'clsx'

// ============================================================
// Class Name Utilities (ฟังก์ชันจัดการ Class Names)
// ============================================================

/**
 * รวม class names เข้าด้วยกัน
 *
 * @description ใช้ร่วมกับ Tailwind CSS เพื่อรวม class names
 *              รองรับ conditional classes และ array
 *
 * @param inputs - Class names ที่ต้องการรวม
 * @returns String ของ class names ที่รวมแล้ว
 *
 * @example
 * cn('btn', 'btn-primary') // 'btn btn-primary'
 * cn('btn', isActive && 'active') // 'btn active' (ถ้า isActive เป็น true)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ============================================================
// Formatting Functions (ฟังก์ชันจัดรูปแบบข้อมูล)
// ============================================================

/**
 * จัดรูปแบบตัวเลขเป็นสกุลเงินบาท
 *
 * @description แปลงตัวเลขให้แสดงในรูปแบบสกุลเงินบาทไทย
 *              รองรับการเปลี่ยน locale
 *
 * @param amount - จำนวนเงิน
 * @param locale - รูปแบบภาษา (default: 'th-TH')
 * @returns String รูปแบบสกุลเงิน (เช่น '฿1,234')
 *
 * @example
 * formatCurrency(1234) // '฿1,234'
 * formatCurrency(1234, 'en-US') // '฿1,234'
 */
export function formatCurrency(amount: number, locale: string = 'th-TH'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * จัดรูปแบบวันที่
 *
 * @description แปลงวันที่ให้แสดงในรูปแบบที่อ่านง่าย
 *              รองรับทั้ง string และ Date object
 *
 * @param date - วันที่ (string หรือ Date)
 * @param locale - รูปแบบภาษา (default: 'th-TH')
 * @returns String รูปแบบวันที่ (เช่น '1 มกราคม 2567')
 *
 * @example
 * formatDate('2024-01-15') // '15 มกราคม 2567'
 * formatDate(new Date(), 'en-US') // 'January 15, 2024'
 */
export function formatDate(date: string | Date, locale: string = 'th-TH'): string {
  // แปลง string เป็น Date object ถ้าจำเป็น
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * จัดรูปแบบช่วงวันที่
 *
 * @description แสดงช่วงวันที่ในรูปแบบ 'วันเริ่มต้น - วันสิ้นสุด'
 *
 * @param startDate - วันที่เริ่มต้น
 * @param endDate - วันที่สิ้นสุด
 * @param locale - รูปแบบภาษา (default: 'th-TH')
 * @returns String ช่วงวันที่
 *
 * @example
 * formatDateRange('2024-01-15', '2024-01-20')
 * // '15 มกราคม 2567 - 20 มกราคม 2567'
 */
export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date,
  locale: string = 'th-TH'
): string {
  return `${formatDate(startDate, locale)} - ${formatDate(endDate, locale)}`
}

// ============================================================
// Calculation Functions (ฟังก์ชันคำนวณ)
// ============================================================

/**
 * คำนวณจำนวนคืนที่เข้าพัก
 *
 * @description คำนวณจำนวนคืนจากวันเช็คอินและเช็คเอาท์
 *              ใช้สำหรับคำนวณราคารวมของการจอง
 *
 * @param checkIn - วันที่เช็คอิน
 * @param checkOut - วันที่เช็คเอาท์
 * @returns จำนวนคืน
 *
 * @example
 * calculateNights('2024-01-15', '2024-01-18') // 3
 */
export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  // แปลง string เป็น Date object ถ้าจำเป็น
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut

  // คำนวณความแตกต่างของเวลา (มิลลิวินาที)
  const diffTime = Math.abs(end.getTime() - start.getTime())

  // แปลงมิลลิวินาทีเป็นจำนวนวัน (1 วัน = 24 * 60 * 60 * 1000 มิลลิวินาที)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * คำนวณราคารวม
 *
 * @description คำนวณราคารวมจากราคาต่อหน่วยและจำนวนหน่วย
 *
 * @param pricePerUnit - ราคาต่อหน่วย (บาท)
 * @param units - จำนวนหน่วย (คืน/วัน)
 * @returns ราคารวม (บาท)
 *
 * @example
 * calculateTotalPrice(1500, 3) // 4500
 */
export function calculateTotalPrice(
  pricePerUnit: number,
  units: number
): number {
  return pricePerUnit * units
}

// ============================================================
// Code Generation Functions (ฟังก์ชันสร้างรหัส)
// ============================================================

/**
 * สร้างรหัสการจอง
 *
 * @description สร้างรหัสการจองรูปแบบ TEYYMMDD-XXXX
 *              - TE = prefix (Travel Experience)
 *              - YYMMDD = ปี/เดือน/วัน
 *              - XXXX = รหัสสุ่ม 4 ตัว
 *
 * @returns รหัสการจอง (เช่น 'TE250115-A1B2')
 *
 * @example
 * generateBookingCode() // 'TE250115-X7K9'
 */
export function generateBookingCode(): string {
  const date = new Date()

  // สร้างส่วนวันที่ YYMMDD
  const year = date.getFullYear().toString().slice(-2) // 2 หลักสุดท้ายของปี
  const month = (date.getMonth() + 1).toString().padStart(2, '0') // เดือน (01-12)
  const day = date.getDate().toString().padStart(2, '0') // วัน (01-31)

  // สร้างรหัสสุ่ม 4 ตัวอักษร (A-Z, 0-9)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()

  return `TE${year}${month}${day}-${random}`
}

// ============================================================
// Validation Functions (ฟังก์ชันตรวจสอบข้อมูล)
// ============================================================

/**
 * ตรวจสอบรูปแบบอีเมล
 *
 * @description ตรวจสอบว่า string เป็นรูปแบบอีเมลที่ถูกต้องหรือไม่
 *
 * @param email - อีเมลที่ต้องการตรวจสอบ
 * @returns true ถ้าอีเมลถูกต้อง, false ถ้าไม่ถูกต้อง
 *
 * @example
 * isValidEmail('test@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * ตรวจสอบเบอร์โทรศัพท์ไทย
 *
 * @description ตรวจสอบว่าเป็นเบอร์โทรศัพท์ไทยที่ถูกต้องหรือไม่
 *              รองรับทั้งเบอร์มือถือ (06, 08, 09) และเบอร์บ้าน (02-07)
 *
 * @param phone - เบอร์โทรที่ต้องการตรวจสอบ
 * @returns true ถ้าเบอร์โทรถูกต้อง, false ถ้าไม่ถูกต้อง
 *
 * @example
 * isValidThaiPhone('0812345678') // true (มือถือ)
 * isValidThaiPhone('021234567') // true (กรุงเทพ)
 * isValidThaiPhone('1234567890') // false
 */
export function isValidThaiPhone(phone: string): boolean {
  // ลบช่องว่างและขีดออก
  const cleanPhone = phone.replace(/[\s-]/g, '')

  // Pattern สำหรับเบอร์โทรไทย:
  // - มือถือ: 06, 08, 09 ตามด้วย 8 หลัก (รวม 10 หลัก)
  // - บ้าน: 02-07 ตามด้วย 7 หลัก (รวม 9 หลัก)
  const phoneRegex = /^(0[689]\d{8}|0[23457]\d{7})$/
  return phoneRegex.test(cleanPhone)
}

/**
 * ตรวจสอบรูปแบบ UUID
 *
 * @description ตรวจสอบว่า string เป็น UUID v1-5 ที่ถูกต้องหรือไม่
 *
 * @param str - String ที่ต้องการตรวจสอบ
 * @returns true ถ้าเป็น UUID, false ถ้าไม่ใช่
 *
 * @example
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * isValidUUID('not-a-uuid') // false
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// ============================================================
// Password Validation (ตรวจสอบความแข็งแรงรหัสผ่าน)
// ============================================================

/**
 * Interface สำหรับผลการตรวจสอบรหัสผ่าน
 */
export interface PasswordValidationResult {
  /** รหัสผ่านผ่านเกณฑ์หรือไม่ */
  isValid: boolean
  /** รายการข้อผิดพลาด */
  errors: string[]
  /** ระดับความแข็งแรง */
  strength: 'weak' | 'medium' | 'strong'
}

/**
 * ตรวจสอบความแข็งแรงของรหัสผ่าน
 *
 * @description ตรวจสอบรหัสผ่านตามเกณฑ์ต่างๆ:
 *              - ความยาวอย่างน้อย 8 ตัวอักษร
 *              - มีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว
 *              - มีตัวพิมพ์เล็กอย่างน้อย 1 ตัว
 *              - มีตัวเลขอย่างน้อย 1 ตัว
 *              - มีอักขระพิเศษ (เพิ่มความแข็งแรง)
 *
 * @param password - รหัสผ่านที่ต้องการตรวจสอบ
 * @param lang - ภาษาของข้อความ error ('th' หรือ 'en')
 * @returns ผลการตรวจสอบพร้อมคะแนนความแข็งแรง
 *
 * @example
 * const result = validatePassword('Abc123!@#', 'th')
 * // { isValid: true, errors: [], strength: 'strong' }
 */
export function validatePassword(password: string, lang: 'th' | 'en' = 'th'): PasswordValidationResult {
  const errors: string[] = []
  let score = 0

  // ข้อความแสดงข้อผิดพลาด 2 ภาษา
  const messages = {
    th: {
      minLength: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
      uppercase: 'ต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว',
      lowercase: 'ต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว',
      number: 'ต้องมีตัวเลขอย่างน้อย 1 ตัว',
      special: 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*)',
    },
    en: {
      minLength: 'Password must be at least 8 characters',
      uppercase: 'Must contain at least 1 uppercase letter',
      lowercase: 'Must contain at least 1 lowercase letter',
      number: 'Must contain at least 1 number',
      special: 'Must contain at least 1 special character (!@#$%^&*)',
    }
  }

  const msg = messages[lang]

  // ตรวจสอบความยาวขั้นต่ำ: 8 ตัวอักษร
  if (password.length >= 8) {
    score++
  } else {
    errors.push(msg.minLength)
  }

  // ตรวจสอบตัวพิมพ์ใหญ่ (A-Z)
  if (/[A-Z]/.test(password)) {
    score++
  } else {
    errors.push(msg.uppercase)
  }

  // ตรวจสอบตัวพิมพ์เล็ก (a-z)
  if (/[a-z]/.test(password)) {
    score++
  } else {
    errors.push(msg.lowercase)
  }

  // ตรวจสอบตัวเลข (0-9)
  if (/\d/.test(password)) {
    score++
  } else {
    errors.push(msg.number)
  }

  // ตรวจสอบอักขระพิเศษ (เพิ่มคะแนนแต่ไม่บังคับ)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++
  }

  // กำหนดระดับความแข็งแรง
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (score >= 5) {
    strength = 'strong'
  } else if (score >= 3) {
    strength = 'medium'
  }

  // รหัสผ่านผ่านเกณฑ์ถ้าไม่มี error (4 เกณฑ์แรกต้องผ่านทั้งหมด)
  const isValid = errors.length === 0

  return { isValid, errors, strength }
}

// ============================================================
// String Manipulation Functions (ฟังก์ชันจัดการ String)
// ============================================================

/**
 * แปลงข้อความเป็น slug
 *
 * @description แปลงข้อความให้เป็น URL-friendly format
 *              ใช้สำหรับสร้าง URL paths
 *
 * @param text - ข้อความที่ต้องการแปลง
 * @returns Slug ที่พร้อมใช้ใน URL
 *
 * @example
 * slugify('Hello World!') // 'hello-world'
 * slugify('Test 123') // 'test-123'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // ลบอักขระพิเศษ
    .replace(/[\s_-]+/g, '-') // แทนที่ช่องว่างด้วย -
    .replace(/^-+|-+$/g, '') // ลบ - ที่หัวและท้าย
}

/**
 * ตัดข้อความให้สั้นลง
 *
 * @description ตัดข้อความที่ยาวเกินไปและเพิ่ม ... ต่อท้าย
 *
 * @param text - ข้อความต้นฉบับ
 * @param length - ความยาวสูงสุด
 * @returns ข้อความที่ตัดแล้ว
 *
 * @example
 * truncate('This is a long text', 10) // 'This is a ...'
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * ดึงตัวอักษรย่อจากชื่อ
 *
 * @description ดึงตัวอักษรแรกของแต่ละคำมารวมกัน (สูงสุด 2 ตัว)
 *              ใช้สำหรับแสดง avatar
 *
 * @param name - ชื่อเต็ม
 * @returns ตัวอักษรย่อ (เช่น 'JD' จาก 'John Doe')
 *
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('Alice') // 'AL'
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ============================================================
// Utility Functions (ฟังก์ชันอรรถประโยชน์อื่นๆ)
// ============================================================

/**
 * หน่วงเวลา
 *
 * @description สร้าง Promise ที่ resolve หลังจากเวลาที่กำหนด
 *              ใช้สำหรับ loading states, animations หรือ rate limiting
 *
 * @param ms - เวลาที่ต้องการหน่วง (มิลลิวินาที)
 * @returns Promise ที่ resolve หลังจากเวลาที่กำหนด
 *
 * @example
 * await delay(1000) // รอ 1 วินาที
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * แปลง URLSearchParams เป็น Object
 *
 * @description แปลง URLSearchParams ให้เป็น plain object
 *              สะดวกสำหรับการใช้งานกับ React state
 *
 * @param searchParams - URLSearchParams object
 * @returns Object ของ key-value pairs
 *
 * @example
 * const params = new URLSearchParams('?a=1&b=2')
 * parseSearchParams(params) // { a: '1', b: '2' }
 */
export function parseSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

/**
 * Parse JSON อย่างปลอดภัย
 *
 * @description Parse JSON string โดยมี fallback value ถ้า parse ไม่สำเร็จ
 *              ป้องกัน error จาก invalid JSON
 *
 * @param json - JSON string ที่ต้องการ parse
 * @param fallback - ค่า default ถ้า parse ไม่สำเร็จ
 * @returns ผลลัพธ์การ parse หรือ fallback value
 *
 * @example
 * safeJsonParse('{"a":1}', {}) // { a: 1 }
 * safeJsonParse('invalid', {}) // {}
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

// ============================================================
// Security Functions (ฟังก์ชันความปลอดภัย)
// ============================================================

/**
 * ทำความสะอาด input เพื่อป้องกัน XSS
 *
 * @description แปลงอักขระพิเศษที่อาจเป็นอันตรายให้เป็น HTML entities
 *              ใช้สำหรับ sanitize user input ก่อนแสดงผล
 *
 * @param input - ข้อความที่ต้องการทำความสะอาด
 * @returns ข้อความที่ปลอดภัย
 *
 * @example
 * sanitizeInput('<script>alert("xss")</script>')
 * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}
