/**
 * ============================================================
 * Cars Page - หน้ารายการรถเช่า (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการรถเช่าทั้งหมด
 *   - ดึงข้อมูลจาก Database ฝั่ง Server (SEO-friendly)
 *   - ใช้ Mock Data เมื่อไม่มีข้อมูลในฐานข้อมูล
 *
 * Route:
 *   - /cars - หน้ารายการรถเช่า
 *
 * การทำงาน:
 *   1. สร้าง Supabase client สำหรับ Server
 *   2. ดึงข้อมูลรถเช่าที่ active จาก Database
 *   3. ถ้าไม่มีข้อมูล ใช้ MOCK_CARS แทน
 *   4. ส่งข้อมูลไปยัง CarsClient component
 *
 * Note:
 *   - เป็น Server Component เพื่อให้ SEO ดี
 *   - Client-side interactions อยู่ใน CarsClient
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase client สำหรับ Server-side */
import { createClient } from '@/lib/supabase/server'

/** Client component สำหรับแสดงรายการรถ */
import CarsClient from './CarsClient'

/** ข้อมูล Mock รถเช่า สำหรับ Development */
import { MOCK_CARS } from '@/lib/constants'

// ============================================================
// Metadata สำหรับ SEO
// ============================================================

/**
 * Metadata ของหน้า Cars
 *
 * @description
 *   กำหนด title และ description สำหรับ SEO
 *   จะถูกใช้โดย Next.js ในการสร้าง <head> tags
 */
export const metadata = {
  title: 'Car Rentals | Got Journey Thailand',
  description: 'Browse our premium car rental collection',
}

// ============================================================
// Page Component - Server Component
// ============================================================

/**
 * หน้ารายการรถเช่า
 *
 * @description
 *   Server Component ที่ดึงข้อมูลรถจาก Database
 *   และส่งต่อให้ Client Component เพื่อแสดงผล
 *
 *   ขั้นตอนการทำงาน:
 *   1. สร้าง Supabase client
 *   2. Query ข้อมูลรถที่ is_active = true
 *   3. เรียงตามวันที่สร้าง (ล่าสุดก่อน)
 *   4. ถ้าไม่มีข้อมูลจริง ใช้ Mock Data
 *   5. Render CarsClient พร้อมข้อมูล
 *
 * @returns {Promise<JSX.Element>} CarsClient component พร้อมข้อมูลรถ
 */
export default async function CarsPage() {
  // สร้าง Supabase client สำหรับ Server
  const supabase = await createClient()

  // ----------------------------------------------------------
  // ดึงข้อมูลรถเช่าจาก Database
  // ----------------------------------------------------------
  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('is_active', true) // เฉพาะรถที่พร้อมให้เช่า
    .order('created_at', { ascending: false }) // เรียงตามวันที่ (ล่าสุดก่อน)

  // ----------------------------------------------------------
  // ใช้ Mock Data ถ้าไม่มีข้อมูลในฐานข้อมูล
  // ----------------------------------------------------------
  // ป้องกันกรณี Database ว่าง หรือยังไม่ได้ setup
  const displayCars = (cars && cars.length > 0) ? cars : MOCK_CARS

  // ----------------------------------------------------------
  // Render Client Component
  // ----------------------------------------------------------
  return <CarsClient cars={displayCars} />
}
