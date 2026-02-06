/**
 * ============================================================
 * Partner Types - Types สำหรับระบบ Partner
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - กำหนด TypeScript Types สำหรับ Partner system
 *   - รองรับทั้งโรงแรมและคนขับรถ
 *
 * ============================================================
 */

// ============================================================
// Enums
// ============================================================

/**
 * ประเภทพาร์ทเนอร์
 */
export enum PartnerType {
  /** โรงแรม */
  HOTEL = 'HOTEL',
  /** คนขับรถ */
  DRIVER = 'DRIVER',
}

// ============================================================
// Interfaces
// ============================================================

/**
 * Interface สำหรับข้อมูลพาร์ทเนอร์
 */
export interface Partner {
  /** รหัสพาร์ทเนอร์ (UUID) */
  id: string
  /** ชื่อพาร์ทเนอร์ */
  name: string
  /** อีเมลสำหรับส่งการแจ้งเตือน */
  email: string
  /** เบอร์โทรศัพท์ */
  phone?: string
  /** ประเภทพาร์ทเนอร์ */
  type: PartnerType
  /** Stripe Connect account ID (ถ้ามี) */
  stripe_account_id?: string
  /** อัตราคอมมิชชั่น (%) */
  commission_rate: number
  /** สถานะการใช้งาน */
  is_active: boolean
  /** วันที่สร้าง (ISO string) */
  created_at: string
  /** วันที่อัปเดตล่าสุด (ISO string) */
  updated_at: string
}

/**
 * Interface สำหรับข้อมูลประเภทห้อง
 */
export interface RoomType {
  /** รหัสประเภทห้อง (UUID) */
  id: string
  /** รหัสโรงแรม */
  hotel_id: string
  /** ชื่อประเภทห้อง (ภาษาไทย) */
  name_th: string
  /** ชื่อประเภทห้อง (ภาษาอังกฤษ) */
  name_en: string
  /** ราคาต่อคืน */
  price_per_night: number
  /** จำนวนผู้เข้าพักสูงสุด */
  max_guests: number
  /** จำนวนห้องทั้งหมดของประเภทนี้ */
  total_rooms: number
  /** สถานะการใช้งาน */
  is_active: boolean
  /** วันที่สร้าง (ISO string) */
  created_at: string
  /** วันที่อัปเดตล่าสุด (ISO string) */
  updated_at: string
}

/**
 * Interface สำหรับข้อมูลฟอร์มพาร์ทเนอร์
 */
export interface PartnerFormData {
  /** ชื่อพาร์ทเนอร์ */
  name: string
  /** อีเมล */
  email: string
  /** เบอร์โทรศัพท์ */
  phone?: string
  /** ประเภทพาร์ทเนอร์ */
  type: PartnerType
  /** Stripe Connect account ID */
  stripe_account_id?: string
  /** อัตราคอมมิชชั่น (%) */
  commission_rate: number
  /** สถานะการใช้งาน */
  is_active: boolean
}

/**
 * Interface สำหรับข้อมูลฟอร์มประเภทห้อง
 */
export interface RoomTypeFormData {
  /** รหัสโรงแรม */
  hotel_id: string
  /** ชื่อประเภทห้อง (ภาษาไทย) */
  name_th: string
  /** ชื่อประเภทห้อง (ภาษาอังกฤษ) */
  name_en: string
  /** ราคาต่อคืน */
  price_per_night: number
  /** จำนวนผู้เข้าพักสูงสุด */
  max_guests: number
  /** จำนวนห้องทั้งหมดของประเภทนี้ */
  total_rooms: number
  /** สถานะการใช้งาน */
  is_active: boolean
}







