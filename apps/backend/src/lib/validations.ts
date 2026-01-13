/**
 * ============================================================
 * Validations - Schema การตรวจสอบข้อมูลด้วย Zod
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - กำหนด validation schemas สำหรับฟอร์มต่างๆ
 *   - ใช้ Zod library สำหรับ type-safe validation
 *   - รองรับข้อความ error ภาษาไทย
 *
 * Schemas ที่มี:
 *   - bookingFormSchema: ฟอร์มการจอง
 *   - hotelFormSchema: ฟอร์มโรงแรม (Admin)
 *   - carFormSchema: ฟอร์มรถ (Admin)
 *   - adminLoginSchema: ฟอร์มล็อกอินแอดมิน
 *   - contactFormSchema: ฟอร์มติดต่อ
 *   - checkoutSchema: ข้อมูลการชำระเงิน
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import { z } from 'zod'

// ============================================================
// Booking Form Schema (ฟอร์มการจอง)
// ============================================================

/**
 * Schema สำหรับฟอร์มการจอง
 *
 * @description ตรวจสอบข้อมูลการจองจากลูกค้า
 *              รวมถึงการตรวจสอบว่าเลือกโรงแรม/รถถูกต้องตามประเภทการจอง
 */
export const bookingFormSchema = z.object({
  /** ประเภทการจอง: HOTEL, CAR, หรือ COMBO */
  booking_type: z.enum(['HOTEL', 'CAR', 'COMBO']),

  /** รหัสโรงแรม (ต้องเป็น UUID ถ้ามี) */
  hotel_id: z.string().uuid().optional(),

  /** รหัสรถ (ต้องเป็น UUID ถ้ามี) */
  car_id: z.string().uuid().optional(),

  /** รหัสแพ็กเกจรถ (ไม่บังคับ - สำหรับการจองรถแบบแพ็กเกจ) */
  car_package_id: z.string().uuid().optional(),

  /** วันที่เช็คอิน - ต้องกรอก */
  check_in_date: z.string().min(1, 'กรุณาเลือกวันเช็คอิน'),

  /** วันที่เช็คเอาท์ - ต้องกรอก */
  check_out_date: z.string().min(1, 'กรุณาเลือกวันเช็คเอาท์'),

  /** จำนวนผู้เข้าพัก - ต้องมีอย่างน้อย 1 คน */
  number_of_guests: z.number().min(1, 'ต้องมีผู้เข้าพักอย่างน้อย 1 คน'),

  /** ชื่อลูกค้า - ต้องมีอย่างน้อย 2 ตัวอักษร */
  customer_name: z.string().min(2, 'กรุณากรอกชื่อ'),

  /** อีเมลลูกค้า - ต้องเป็นรูปแบบอีเมลที่ถูกต้อง */
  customer_email: z.string().email('อีเมลไม่ถูกต้อง'),

  /** เบอร์โทรลูกค้า - ต้องมีอย่างน้อย 9 หลัก */
  customer_phone: z.string().min(9, 'เบอร์โทรไม่ถูกต้อง'),

  /** LINE ID (ไม่บังคับ) */
  customer_line: z.string().optional(),

  /** คำขอพิเศษ (ไม่บังคับ) */
  special_requests: z.string().optional(),
  
  /** รหัสประเภทห้อง (ไม่บังคับ - สำหรับการจองโรงแรม) */
  room_type_id: z.string().uuid().optional(),
  
  /** สกุลเงิน */
  currency: z.enum(['THB', 'USD', 'EUR']).optional(),
}).refine(data => {
  // ตรวจสอบว่าเลือกโรงแรม/รถถูกต้องตามประเภทการจอง
  // - HOTEL: ต้องมี hotel_id
  // - CAR: ต้องมี car_id
  // - COMBO: ต้องมีทั้ง hotel_id และ car_id
  if (data.booking_type === 'HOTEL' && !data.hotel_id) return false
  if (data.booking_type === 'CAR' && !data.car_id) return false
  if (data.booking_type === 'COMBO' && (!data.hotel_id || !data.car_id)) return false
  return true
}, {
  message: 'กรุณาเลือกโรงแรมหรือรถที่ต้องการจอง'
})

// ============================================================
// Hotel Form Schema (ฟอร์มโรงแรม - Admin)
// ============================================================

/**
 * Schema สำหรับฟอร์มโรงแรม/แพ็คเกจ
 *
 * @description ใช้ตรวจสอบข้อมูลเมื่อสร้างหรือแก้ไขโรงแรมในหน้า Admin
 *              รองรับข้อมูล 2 ภาษา (ไทย/อังกฤษ)
 */
export const hotelFormSchema = z.object({
  /** ชื่อโรงแรม (ภาษาไทย) - ต้องมีอย่างน้อย 2 ตัวอักษร */
  name_th: z.string().min(2, 'กรุณากรอกชื่อโรงแรม (ภาษาไทย)'),

  /** ชื่อโรงแรม (ภาษาอังกฤษ) - ต้องมีอย่างน้อย 2 ตัวอักษร */
  name_en: z.string().min(2, 'กรุณากรอกชื่อโรงแรม (ภาษาอังกฤษ)'),

  /** รายละเอียด (ภาษาไทย) - ต้องมีอย่างน้อย 10 ตัวอักษร */
  description_th: z.string().min(10, 'กรุณากรอกรายละเอียด (ภาษาไทย)'),

  /** รายละเอียด (ภาษาอังกฤษ) - ต้องมีอย่างน้อย 10 ตัวอักษร */
  description_en: z.string().min(10, 'กรุณากรอกรายละเอียด (ภาษาอังกฤษ)'),

  /** ที่ตั้ง - ต้องมีอย่างน้อย 2 ตัวอักษร */
  location: z.string().min(2, 'กรุณากรอกที่ตั้ง'),

  /** ระดับดาว (1-5) */
  star_rating: z.number().min(1).max(5),

  /** ราคาต่อคืน - ต้องมากกว่า 0 */
  price_per_night: z.number().min(1, 'ราคาต้องมากกว่า 0'),

  /** จำนวนผู้เข้าพักสูงสุด (1-20) */
  max_guests: z.number().min(1).max(20),

  /** ประเภทห้อง (ภาษาไทย) */
  room_type_th: z.string().min(2, 'กรุณากรอกประเภทห้อง (ภาษาไทย)'),

  /** ประเภทห้อง (ภาษาอังกฤษ) */
  room_type_en: z.string().min(2, 'กรุณากรอกประเภทห้อง (ภาษาอังกฤษ)'),

  /** สิ่งอำนวยความสะดวก (ภาษาไทย) - Array ของ strings */
  amenities_th: z.array(z.string()),

  /** สิ่งอำนวยความสะดวก (ภาษาอังกฤษ) - Array ของ strings */
  amenities_en: z.array(z.string()),

  /** รูปภาพ - Array ของ URLs */
  images: z.array(z.string().url()),

  /** สถานะการใช้งาน */
  is_active: z.boolean(),
})

// ============================================================
// Car Form Schema (ฟอร์มรถ - Admin)
// ============================================================

/**
 * Schema สำหรับฟอร์มรถเช่า
 *
 * @description ใช้ตรวจสอบข้อมูลเมื่อสร้างหรือแก้ไขรถในหน้า Admin
 *              รองรับข้อมูล 2 ภาษา (ไทย/อังกฤษ)
 */
export const carFormSchema = z.object({
  /** ชื่อรถ (ภาษาไทย) - ต้องมีอย่างน้อย 2 ตัวอักษร */
  name_th: z.string().min(2, 'กรุณากรอกชื่อรถ (ภาษาไทย)'),

  /** ชื่อรถ (ภาษาอังกฤษ) - ต้องมีอย่างน้อย 2 ตัวอักษร */
  name_en: z.string().min(2, 'กรุณากรอกชื่อรถ (ภาษาอังกฤษ)'),

  /** รายละเอียด (ภาษาไทย) - ต้องมีอย่างน้อย 10 ตัวอักษร */
  description_th: z.string().min(10, 'กรุณากรอกรายละเอียด (ภาษาไทย)'),

  /** รายละเอียด (ภาษาอังกฤษ) - ต้องมีอย่างน้อย 10 ตัวอักษร */
  description_en: z.string().min(10, 'กรุณากรอกรายละเอียด (ภาษาอังกฤษ)'),

  /** ประเภทรถ (ภาษาไทย) */
  car_type_th: z.string().min(2, 'กรุณากรอกประเภทรถ (ภาษาไทย)'),

  /** ประเภทรถ (ภาษาอังกฤษ) */
  car_type_en: z.string().min(2, 'กรุณากรอกประเภทรถ (ภาษาอังกฤษ)'),

  /** จำนวนผู้โดยสารสูงสุด (1-50) */
  max_passengers: z.number().min(1).max(50),

  /** ราคาต่อวัน - ต้องมากกว่า 0 */
  price_per_day: z.number().min(1, 'ราคาต้องมากกว่า 0'),

  /** สิ่งที่รวมในบริการ (ภาษาไทย) - Array ของ strings */
  includes_th: z.array(z.string()),

  /** สิ่งที่รวมในบริการ (ภาษาอังกฤษ) - Array ของ strings */
  includes_en: z.array(z.string()),

  /** รูปภาพ - Array ของ URLs */
  images: z.array(z.string().url()),

  /** สถานะการใช้งาน */
  is_active: z.boolean(),
})

// ============================================================
// Admin Login Schema (ฟอร์มล็อกอินแอดมิน)
// ============================================================

/**
 * Schema สำหรับฟอร์มล็อกอินแอดมิน
 *
 * @description ตรวจสอบข้อมูลการล็อกอินของแอดมิน
 */
export const adminLoginSchema = z.object({
  /** อีเมล - ต้องเป็นรูปแบบอีเมลที่ถูกต้อง */
  email: z.string().email('อีเมลไม่ถูกต้อง'),

  /** รหัสผ่าน - ต้องมีอย่างน้อย 6 ตัวอักษร */
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
})

// ============================================================
// Contact Form Schema (ฟอร์มติดต่อ)
// ============================================================

/**
 * Schema สำหรับฟอร์มติดต่อ
 *
 * @description ตรวจสอบข้อมูลจากฟอร์มติดต่อในหน้า Contact
 */
export const contactFormSchema = z.object({
  /** ชื่อ - ต้องมีอย่างน้อย 2 ตัวอักษร */
  name: z.string().min(2, 'กรุณากรอกชื่อ'),

  /** อีเมล - ต้องเป็นรูปแบบอีเมลที่ถูกต้อง */
  email: z.string().email('อีเมลไม่ถูกต้อง'),

  /** เบอร์โทร (ไม่บังคับ) */
  phone: z.string().optional(),

  /** ข้อความ - ต้องมีอย่างน้อย 10 ตัวอักษร */
  message: z.string().min(10, 'กรุณากรอกข้อความอย่างน้อย 10 ตัวอักษร'),
})

// ============================================================
// Checkout Schema (ข้อมูลการชำระเงิน)
// ============================================================

/**
 * Schema สำหรับการชำระเงิน
 *
 * @description ตรวจสอบข้อมูลที่ส่งไปยัง Stripe Checkout
 */
export const checkoutSchema = z.object({
  /** รหัสการจอง - ต้องเป็น UUID */
  booking_id: z.string().uuid(),

  /** URL สำหรับ redirect เมื่อสำเร็จ */
  success_url: z.string().url(),

  /** URL สำหรับ redirect เมื่อยกเลิก */
  cancel_url: z.string().url(),
})

// ============================================================
// Type Exports (Export Types จาก Schemas)
// ============================================================

/**
 * Type สำหรับข้อมูล input ของฟอร์มการจอง
 * @description ใช้สำหรับ type-checking ในฟอร์ม
 */
export type BookingFormInput = z.infer<typeof bookingFormSchema>

/**
 * Type สำหรับข้อมูล input ของฟอร์มโรงแรม
 */
export type HotelFormInput = z.infer<typeof hotelFormSchema>

/**
 * Type สำหรับข้อมูล input ของฟอร์มรถ
 */
export type CarFormInput = z.infer<typeof carFormSchema>

/**
 * Type สำหรับข้อมูล input ของฟอร์มล็อกอินแอดมิน
 */
export type AdminLoginInput = z.infer<typeof adminLoginSchema>

/**
 * Type สำหรับข้อมูล input ของฟอร์มติดต่อ
 */
export type ContactFormInput = z.infer<typeof contactFormSchema>

/**
 * Type สำหรับข้อมูล input ของการชำระเงิน
 */
export type CheckoutInput = z.infer<typeof checkoutSchema>
