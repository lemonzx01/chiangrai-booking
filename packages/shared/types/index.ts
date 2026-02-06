/**
 * ============================================================
 * Types & Interfaces - ไฟล์กำหนด Types หลักของระบบ
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - กำหนด TypeScript Types และ Interfaces ทั้งหมดที่ใช้ในโปรเจค
 *   - รองรับข้อมูล 2 ภาษา (ไทย/อังกฤษ)
 *
 * เนื้อหาหลัก:
 *   - Enums: สถานะการจอง, ประเภทการจอง, สถานะการชำระเงิน
 *   - Database Types: Hotel, Car, Booking, Payment, Admin, User
 *   - Utility Types: LocalizedString, ApiResponse, PaginatedResponse
 *   - Form Types: BookingFormData, HotelFormData, CarFormData
 *
 * ============================================================
 */

// ============================================================
// Enums (ค่าคงที่แบบ Enum)
// ============================================================

/**
 * สถานะของการจอง
 * @description ใช้ติดตามสถานะการจองตั้งแต่เริ่มต้นจนเสร็จสิ้น
 */
export enum BookingStatus {
  /** รอดำเนินการ - การจองใหม่ที่ยังไม่ได้รับการยืนยัน */
  PENDING = 'PENDING',
  /** ยืนยันแล้ว - การจองได้รับการยืนยันจากแอดมิน */
  CONFIRMED = 'CONFIRMED',
  /** ชำระเงินแล้ว - ลูกค้าชำระเงินเรียบร้อย */
  PAID = 'PAID',
  /** ยกเลิก - การจองถูกยกเลิก */
  CANCELLED = 'CANCELLED',
  /** เสร็จสิ้น - การจองเสร็จสมบูรณ์ */
  COMPLETED = 'COMPLETED'
}

/**
 * ประเภทการจอง
 * @description กำหนดว่าการจองเป็นแบบโรงแรม รถ หรือทั้งสองอย่าง
 */
export enum BookingType {
  /** จองโรงแรม/แพ็คเกจอย่างเดียว */
  HOTEL = 'HOTEL',
  /** จองรถเช่าอย่างเดียว */
  CAR = 'CAR',
  /** จองแพ็คเกจรวม (โรงแรม + รถ) */
  COMBO = 'COMBO'
}

/**
 * สถานะการชำระเงิน
 * @description ติดตามสถานะการชำระเงินผ่าน Stripe
 */
export enum PaymentStatus {
  /** รอชำระเงิน */
  PENDING = 'PENDING',
  /** ชำระเงินสำเร็จ */
  SUCCEEDED = 'SUCCEEDED',
  /** ชำระเงินไม่สำเร็จ */
  FAILED = 'FAILED',
  /** คืนเงินแล้ว */
  REFUNDED = 'REFUNDED'
}

/**
 * สกุลเงิน
 * @description รองรับหลายสกุลเงินสำหรับการชำระเงิน
 */
export enum Currency {
  /** บาทไทย */
  THB = 'THB',
  /** ดอลลาร์สหรัฐ */
  USD = 'USD',
  /** ยูโร */
  EUR = 'EUR',
  /** เยนญี่ปุ่น */
  JPY = 'JPY',
  /** หยวนจีน */
  CNY = 'CNY',
  /** ปอนด์อังกฤษ */
  GBP = 'GBP'
}

// ============================================================
// Database Types (Types สำหรับข้อมูลจากฐานข้อมูล)
// ============================================================

/**
 * Interface สำหรับข้อมูลโรงแรม/แพ็คเกจ
 * @description เก็บข้อมูลโรงแรมทั้งภาษาไทยและอังกฤษ รองรับ i18n
 */
export interface Hotel {
  /** รหัสโรงแรม (UUID) */
  id: string
  /** ชื่อโรงแรม (ภาษาไทย) */
  name_th: string
  /** ชื่อโรงแรม (ภาษาอังกฤษ) */
  name_en: string
  /** รายละเอียดโรงแรม (ภาษาไทย) */
  description_th: string
  /** รายละเอียดโรงแรม (ภาษาอังกฤษ) */
  description_en: string
  /** ที่ตั้ง (เก็บค่าเดิม - deprecated) */
  location?: string
  /** ที่ตั้ง (ภาษาไทย) */
  location_th?: string
  /** ที่ตั้ง (ภาษาอังกฤษ) */
  location_en?: string
  /** ระดับดาว (1-5) */
  star_rating: number
  /** ราคาต่อคืน (บาท) - เก็บไว้เพื่อ backward compatibility */
  price_per_night: number
  /** ราคาต่อคืนในสกุลเงินที่เลือก */
  base_price_per_night: number
  /** จำนวนผู้เข้าพักสูงสุด */
  max_guests: number
  /** ประเภทห้อง (ภาษาไทย) - เก็บไว้เพื่อ backward compatibility */
  room_type_th: string
  /** ประเภทห้อง (ภาษาอังกฤษ) - เก็บไว้เพื่อ backward compatibility */
  room_type_en: string
  /** สิ่งอำนวยความสะดวก (ภาษาไทย) */
  amenities_th: string[]
  /** สิ่งอำนวยความสะดวก (ภาษาอังกฤษ) */
  amenities_en: string[]
  /** รูปภาพโรงแรม (URLs) */
  images: string[]
  /** รหัสพาร์ทเนอร์ (ถ้ามี) - deprecated, ใช้ owner_id แทน */
  partner_id?: string
  /** รหัสเจ้าของ (user ID) */
  owner_id?: string
  /** สกุลเงิน */
  currency: Currency
  /** สถานะการใช้งาน */
  is_active: boolean
  /** วันที่สร้าง (ISO string) */
  created_at: string
  /** วันที่อัปเดตล่าสุด (ISO string) */
  updated_at?: string
}

/**
 * Interface สำหรับข้อมูลรถเช่า
 * @description เก็บข้อมูลรถเช่าทั้งภาษาไทยและอังกฤษ
 */
export interface Car {
  /** รหัสรถ (UUID) */
  id: string
  /** ชื่อรถ (ภาษาไทย) */
  name_th: string
  /** ชื่อรถ (ภาษาอังกฤษ) */
  name_en: string
  /** รายละเอียดรถ (ภาษาไทย) */
  description_th: string
  /** รายละเอียดรถ (ภาษาอังกฤษ) */
  description_en: string
  /** ประเภทรถ (ภาษาไทย) */
  car_type_th: string
  /** ประเภทรถ (ภาษาอังกฤษ) */
  car_type_en: string
  /** จำนวนผู้โดยสารสูงสุด */
  max_passengers: number
  /** ราคาต่อวัน (บาท) - เก็บไว้เพื่อ backward compatibility */
  price_per_day: number
  /** ราคาต่อวันในสกุลเงินที่เลือก */
  base_price_per_day: number
  /** สิ่งที่รวมอยู่ในบริการ (ภาษาไทย) */
  includes_th: string[]
  /** สิ่งที่รวมอยู่ในบริการ (ภาษาอังกฤษ) */
  includes_en: string[]
  /** รูปภาพรถ (URLs) */
  images: string[]
  /** รหัสพาร์ทเนอร์ (คนขับรถ) - deprecated, ใช้ owner_id แทน */
  partner_id?: string
  /** รหัสเจ้าของ (user ID) */
  owner_id?: string
  /** ชื่อคนขับ */
  driver_name?: string
  /** นามสกุลคนขับ */
  driver_surname?: string
  /** สกุลเงิน */
  currency: Currency
  /** สถานะการใช้งาน */
  is_active: boolean
  /** วันที่สร้าง (ISO string) */
  created_at: string
  /** วันที่อัปเดตล่าสุด (ISO string) */
  updated_at?: string
}

/**
 * Interface สำหรับข้อมูลการจอง
 * @description เก็บข้อมูลการจองทั้งหมด รวมถึงข้อมูลลูกค้าและสถานะ
 */
export interface Booking {
  /** รหัสการจอง (UUID) */
  id: string
  /** รหัสการจองที่แสดงให้ลูกค้า (เช่น TE250101-XXXX) */
  booking_code: string
  /** ประเภทการจอง (HOTEL/CAR/COMBO) */
  booking_type: BookingType
  /** รหัสโรงแรมที่จอง (ถ้ามี) */
  hotel_id?: string
  /** รหัสรถที่จอง (ถ้ามี) */
  car_id?: string
  /** รหัสประเภทห้องที่จอง (ถ้ามี) */
  room_type_id?: string
  /** วันที่เช็คอิน/รับรถ (ISO string) */
  check_in_date: string
  /** วันที่เช็คเอาท์/คืนรถ (ISO string) */
  check_out_date: string
  /** จำนวนผู้เข้าพัก/ผู้โดยสาร */
  number_of_guests: number
  /** ชื่อลูกค้า */
  customer_name: string
  /** อีเมลลูกค้า */
  customer_email: string
  /** เบอร์โทรลูกค้า */
  customer_phone: string
  /** LINE ID ลูกค้า (ถ้ามี) */
  customer_line?: string
  /** คำขอพิเศษ (ถ้ามี) */
  special_requests?: string
  /** ราคารวมทั้งหมด */
  total_price: number
  /** สกุลเงินที่ใช้จอง */
  currency: Currency
  /** สถานะการจอง */
  status: BookingStatus
  /** วันที่สร้าง (ISO string) */
  created_at: string
  /** วันที่อัปเดตล่าสุด (ISO string) */
  updated_at: string

  // ----------------------------------------------------------
  // Cancellation & Refund
  // ----------------------------------------------------------

  /** วันที่ยกเลิก (ISO string) */
  cancelled_at?: string
  /** ผู้ยกเลิก ('customer' | 'admin') */
  cancelled_by?: string
  /** เหตุผลในการยกเลิก */
  cancellation_reason?: string
  /** จำนวนเงินคืน */
  refund_amount?: number
  /** เปอร์เซ็นต์คืนเงิน (0, 50, 100) */
  refund_percentage?: number
  /** สถานะการคืนเงิน */
  refund_status?: 'PENDING' | 'PROCESSED' | 'FAILED' | 'NONE'

  // ----------------------------------------------------------
  // Relations (ข้อมูลที่ join มาจากตารางอื่น)
  // ----------------------------------------------------------

  /** ข้อมูลโรงแรม (จาก JOIN query) */
  hotel?: Hotel
  /** ข้อมูลรถ (จาก JOIN query) */
  car?: Car
}

/**
 * Interface สำหรับข้อมูลการชำระเงิน
 * @description เก็บข้อมูลการชำระเงินผ่าน Stripe
 */
export interface Payment {
  /** รหัสการชำระเงิน (UUID) */
  id: string
  /** รหัสการจองที่เกี่ยวข้อง */
  booking_id: string
  /** Stripe Payment Intent ID */
  stripe_payment_intent_id?: string
  /** Stripe Checkout Session ID */
  stripe_checkout_session_id?: string
  /** จำนวนเงิน (สตางค์) */
  amount: number
  /** สกุลเงิน */
  currency: Currency
  /** สถานะการชำระเงิน */
  status: PaymentStatus
  /** วันที่ชำระเงิน (ISO string) */
  paid_at?: string
  /** วันที่สร้าง (ISO string) */
  created_at: string
  /** วันที่อัปเดตล่าสุด (ISO string) */
  updated_at: string

  // ----------------------------------------------------------
  // Refund
  // ----------------------------------------------------------

  /** Stripe Refund ID */
  stripe_refund_id?: string
  /** จำนวนเงินคืน */
  refund_amount?: number
  /** วันที่คืนเงิน (ISO string) */
  refunded_at?: string

  // ----------------------------------------------------------
  // Relations
  // ----------------------------------------------------------

  /** ข้อมูลการจอง (จาก JOIN query) */
  booking?: Booking
}

/**
 * Interface สำหรับข้อมูลแอดมิน
 * @description เก็บข้อมูลผู้ดูแลระบบ
 */
export interface Admin {
  /** รหัสแอดมิน (UUID) */
  id: string
  /** อีเมลสำหรับเข้าสู่ระบบ */
  email: string
  /** รหัสผ่านที่เข้ารหัสแล้ว (bcrypt hash) */
  password_hash: string
  /** ชื่อแอดมิน */
  name: string
  /** บทบาท (เช่น admin, superadmin) */
  role: string
  /** สถานะการใช้งาน */
  is_active: boolean
  /** วันที่เข้าสู่ระบบล่าสุด (ISO string) */
  last_login?: string
  /** วันที่สร้าง (ISO string) */
  created_at: string
  /** วันที่อัปเดตล่าสุด (ISO string) */
  updated_at: string
}

/**
 * Interface สำหรับข้อมูลผู้ใช้งาน (ลูกค้า)
 * @description เก็บข้อมูลผู้ใช้งานที่ลงทะเบียนในระบบ
 */
export interface User {
  /** รหัสผู้ใช้ (UUID) */
  id: string
  /** อีเมลสำหรับเข้าสู่ระบบ */
  email: string
  /** รหัสผ่านที่เข้ารหัสแล้ว (bcrypt hash) - nullable สำหรับ Google login */
  password_hash?: string
  /** ชื่อผู้ใช้ */
  name: string
  /** บทบาท: admin, partner, หรือ user */
  role: 'admin' | 'partner' | 'user'
  /** Google OAuth ID (สำหรับ Google login) */
  google_id?: string
  /** เบอร์โทรศัพท์ (ถ้ามี) */
  phone?: string
  /** สถานะการใช้งาน */
  is_active: boolean
  /** อีเมลได้รับการยืนยันแล้ว */
  email_verified?: boolean
  /** วันที่ยืนยันอีเมล (ISO string) */
  email_verified_at?: string
  /** วันที่สร้าง (ISO string) */
  created_at: string
  /** วันที่อัปเดตล่าสุด (ISO string) */
  updated_at: string
}

/**
 * Valid status transitions สำหรับ booking
 */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.PAID, BookingStatus.CANCELLED],
  [BookingStatus.PAID]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.COMPLETED]: [],
}

// ============================================================
// Localization Types (Types สำหรับระบบหลายภาษา)
// ============================================================

/**
 * Type สำหรับข้อความ 2 ภาษา
 * @description ใช้เก็บข้อความที่มีทั้งภาษาไทยและอังกฤษ
 *
 * @example
 * const title: LocalizedString = { th: 'สวัสดี', en: 'Hello' }
 */
export type LocalizedString = {
  /** ข้อความภาษาไทย */
  th: string
  /** ข้อความภาษาอังกฤษ */
  en: string
}

/**
 * Type สำหรับ Array 2 ภาษา
 * @description ใช้เก็บรายการที่มีทั้งภาษาไทยและอังกฤษ
 *
 * @example
 * const amenities: LocalizedArray = {
 *   th: ['สระว่ายน้ำ', 'ฟิตเนส'],
 *   en: ['Swimming Pool', 'Fitness']
 * }
 */
export type LocalizedArray = {
  /** รายการภาษาไทย */
  th: string[]
  /** รายการภาษาอังกฤษ */
  en: string[]
}

// ============================================================
// Utility Functions (ฟังก์ชันช่วยสำหรับ Localization)
// ============================================================

/**
 * ดึงค่าตามภาษาจาก object
 *
 * @description ใช้ดึงค่า field ตามภาษาที่ต้องการจาก object ที่มี suffix _th/_en
 *
 * @param item - Object ที่มี fields แบบ field_th, field_en
 * @param field - ชื่อ field ที่ต้องการ (ไม่รวม suffix)
 * @param lang - ภาษาที่ต้องการ ('th' หรือ 'en')
 * @returns ค่าของ field ตามภาษาที่ระบุ
 *
 * @example
 * const hotel = { name_th: 'โรงแรม', name_en: 'Hotel' }
 * getLocalized(hotel, 'name', 'th') // 'โรงแรม'
 */
export function getLocalized<T>(
  item: { [key: string]: T },
  field: string,
  lang: 'th' | 'en'
): T {
  return item[`${field}_${lang}`] as T
}

/**
 * แปลงข้อมูลโรงแรมให้เป็นรูปแบบที่ใช้งานง่าย
 *
 * @description รวม fields ภาษาไทย/อังกฤษ ให้เป็น field เดียวตามภาษาที่เลือก
 *
 * @param hotel - ข้อมูลโรงแรมต้นฉบับ
 * @param lang - ภาษาที่ต้องการ
 * @returns ข้อมูลโรงแรมที่มี fields name, description, room_type, amenities
 *
 * @example
 * const localizedHotel = toLocalizedHotel(hotel, 'th')
 * console.log(localizedHotel.name) // แสดงชื่อภาษาไทย
 */
export function toLocalizedHotel(hotel: Hotel, lang: 'th' | 'en') {
  return {
    ...hotel,
    name: hotel[`name_${lang}`],
    description: hotel[`description_${lang}`],
    room_type: hotel[`room_type_${lang}`],
    amenities: hotel[`amenities_${lang}`],
  }
}

/**
 * แปลงข้อมูลรถให้เป็นรูปแบบที่ใช้งานง่าย
 *
 * @description รวม fields ภาษาไทย/อังกฤษ ให้เป็น field เดียวตามภาษาที่เลือก
 *
 * @param car - ข้อมูลรถต้นฉบับ
 * @param lang - ภาษาที่ต้องการ
 * @returns ข้อมูลรถที่มี fields name, description, car_type, includes
 *
 * @example
 * const localizedCar = toLocalizedCar(car, 'en')
 * console.log(localizedCar.name) // แสดงชื่อภาษาอังกฤษ
 */
export function toLocalizedCar(car: Car, lang: 'th' | 'en') {
  return {
    ...car,
    name: car[`name_${lang}`],
    description: car[`description_${lang}`],
    car_type: car[`car_type_${lang}`],
    includes: car[`includes_${lang}`],
  }
}

// ============================================================
// API Response Types (Types สำหรับ API Response)
// ============================================================

/**
 * Interface สำหรับ API Response ทั่วไป
 *
 * @description รูปแบบมาตรฐานสำหรับ response จาก API
 *
 * @template T - ประเภทของข้อมูลที่ส่งกลับ
 *
 * @example
 * const response: ApiResponse<Hotel> = {
 *   data: hotel,
 *   message: 'Success'
 * }
 */
export interface ApiResponse<T> {
  /** ข้อมูลที่ส่งกลับ (ถ้าสำเร็จ) */
  data?: T
  /** ข้อความ error (ถ้าล้มเหลว) */
  error?: string
  /** ข้อความเพิ่มเติม */
  message?: string
}

/**
 * Interface สำหรับ API Response แบบแบ่งหน้า
 *
 * @description ใช้สำหรับ response ที่มีหลายรายการและต้องแบ่งหน้า
 *
 * @template T - ประเภทของข้อมูลแต่ละรายการ
 *
 * @example
 * const response: PaginatedResponse<Hotel> = {
 *   data: hotels,
 *   total: 100,
 *   limit: 10,
 *   offset: 0
 * }
 */
export interface PaginatedResponse<T> {
  /** รายการข้อมูล */
  data: T[]
  /** จำนวนรายการทั้งหมด */
  total: number
  /** จำนวนรายการต่อหน้า */
  limit: number
  /** ตำแหน่งเริ่มต้น */
  offset: number
}

// ============================================================
// Form Types (Types สำหรับ Form Data)
// ============================================================

/**
 * Interface สำหรับข้อมูลฟอร์มการจอง
 * @description ใช้สำหรับ validate และส่งข้อมูลการจองใหม่
 */
export interface BookingFormData {
  /** ประเภทการจอง */
  booking_type: BookingType
  /** รหัสโรงแรม (ต้องมีถ้า booking_type เป็น HOTEL หรือ COMBO) */
  hotel_id?: string
  /** รหัสรถ (ต้องมีถ้า booking_type เป็น CAR หรือ COMBO) */
  car_id?: string
  /** รหัสประเภทห้อง (ถ้ามี - สำหรับการจองโรงแรม) */
  room_type_id?: string
  /** สกุลเงิน */
  currency?: Currency
  /** วันที่เช็คอิน/รับรถ (ISO string) */
  check_in_date: string
  /** วันที่เช็คเอาท์/คืนรถ (ISO string) */
  check_out_date: string
  /** จำนวนผู้เข้าพัก */
  number_of_guests: number
  /** ชื่อลูกค้า */
  customer_name: string
  /** อีเมลลูกค้า */
  customer_email: string
  /** เบอร์โทรลูกค้า */
  customer_phone: string
  /** LINE ID (ถ้ามี) */
  customer_line?: string
  /** คำขอพิเศษ (ถ้ามี) */
  special_requests?: string
}

/**
 * Interface สำหรับข้อมูลฟอร์มโรงแรม
 * @description ใช้สำหรับสร้างหรือแก้ไขข้อมูลโรงแรม
 */
export interface HotelFormData {
  /** ชื่อโรงแรม (ภาษาไทย) */
  name_th: string
  /** ชื่อโรงแรม (ภาษาอังกฤษ) */
  name_en: string
  /** รายละเอียด (ภาษาไทย) */
  description_th: string
  /** รายละเอียด (ภาษาอังกฤษ) */
  description_en: string
  /** ที่ตั้ง */
  location: string
  /** ระดับดาว (1-5) */
  star_rating: number
  /** ราคาต่อคืน (บาท) */
  price_per_night: number
  /** จำนวนผู้เข้าพักสูงสุด */
  max_guests: number
  /** ประเภทห้อง (ภาษาไทย) */
  room_type_th: string
  /** ประเภทห้อง (ภาษาอังกฤษ) */
  room_type_en: string
  /** สิ่งอำนวยความสะดวก (ภาษาไทย) */
  amenities_th: string[]
  /** สิ่งอำนวยความสะดวก (ภาษาอังกฤษ) */
  amenities_en: string[]
  /** รูปภาพ (URLs) */
  images: string[]
  /** สถานะการใช้งาน */
  is_active: boolean
}

/**
 * Interface สำหรับข้อมูลฟอร์มรถ
 * @description ใช้สำหรับสร้างหรือแก้ไขข้อมูลรถ
 */
export interface CarFormData {
  /** ชื่อรถ (ภาษาไทย) */
  name_th: string
  /** ชื่อรถ (ภาษาอังกฤษ) */
  name_en: string
  /** รายละเอียด (ภาษาไทย) */
  description_th: string
  /** รายละเอียด (ภาษาอังกฤษ) */
  description_en: string
  /** ประเภทรถ (ภาษาไทย) */
  car_type_th: string
  /** ประเภทรถ (ภาษาอังกฤษ) */
  car_type_en: string
  /** จำนวนผู้โดยสารสูงสุด */
  max_passengers: number
  /** ราคาต่อวัน (บาท) */
  price_per_day: number
  /** สิ่งที่รวมอยู่ในบริการ (ภาษาไทย) */
  includes_th: string[]
  /** สิ่งที่รวมอยู่ในบริการ (ภาษาอังกฤษ) */
  includes_en: string[]
  /** รูปภาพ (URLs) */
  images: string[]
  /** สถานะการใช้งาน */
  is_active: boolean
}

// ============================================================
// Dashboard Types (Types สำหรับหน้า Dashboard)
// ============================================================

/**
 * Interface สำหรับสถิติ Dashboard
 * @description เก็บข้อมูลสรุปสำหรับแสดงในหน้า Dashboard แอดมิน
 */
export interface DashboardStats {
  /** จำนวนการจองทั้งหมด */
  totalBookings: number
  /** รายได้รวม (บาท) */
  totalRevenue: number
  /** จำนวนการจองที่รอดำเนินการ */
  pendingBookings: number
  /** จำนวนการจองที่ยืนยันแล้ว */
  confirmedBookings: number
  /** จำนวนโรงแรม/แพ็คเกจทั้งหมด */
  totalHotels: number
  /** จำนวนรถเช่าทั้งหมด */
  totalCars: number
}

// ============================================================
// Navigation Types (Types สำหรับ Navigation)
// ============================================================

/**
 * Interface สำหรับรายการเมนู Navigation
 * @description ใช้กำหนดรายการเมนูที่แสดงใน Navbar
 */
export interface NavItem {
  /** ข้อความแสดง (รองรับ 2 ภาษา) */
  label: LocalizedString
  /** URL ปลายทาง */
  href: string
}

// ============================================================
// Partner Types (Export from partner.ts)
// ============================================================

export type { Partner, PartnerFormData, RoomType, RoomTypeFormData } from './partner'
export { PartnerType } from './partner'
