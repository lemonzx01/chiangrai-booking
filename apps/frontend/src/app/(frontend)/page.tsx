/**
 * ============================================================
 * Home Page - หน้าแรกของเว็บไซต์ (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงหน้าแรกของเว็บไซต์
 *   - ดึงข้อมูลโรงแรมและรถเด่นจาก Database
 *   - ส่งข้อมูลไปยัง HomeClient component
 *
 * Route:
 *   - / - หน้าแรก
 *
 * การทำงาน:
 *   1. สร้าง Supabase client
 *   2. ดึงโรงแรม featured (6 รายการ)
 *   3. ดึงรถ featured (4 รายการ)
 *   4. ถ้าไม่มีข้อมูล ใช้ Mock Data
 *   5. Render HomeClient
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase client สำหรับ Server-side */
import { createClient } from '@/lib/supabase/server'

/** Client component สำหรับแสดงหน้าแรก */
import HomeClient from './HomeClient'

/** ข้อมูล Mock สำหรับ Development */
import { MOCK_HOTELS, MOCK_CARS } from '@/lib/constants'

// ============================================================
// Page Component - Server Component
// ============================================================

/**
 * หน้าแรกของเว็บไซต์
 *
 * @description
 *   Server Component ที่ดึงข้อมูลโรงแรมและรถเด่น
 *   และส่งต่อให้ Client Component
 *
 * @returns {Promise<JSX.Element>} HomeClient component
 */
export default async function HomePage() {
  // สร้าง Supabase client
  const supabase = await createClient()

  // ----------------------------------------------------------
  // ดึงข้อมูลโรงแรม Featured (6 รายการ)
  // ----------------------------------------------------------
  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true) // เฉพาะที่เปิดให้บริการ
    .order('created_at', { ascending: false }) // ล่าสุดก่อน
    .limit(6) // จำกัด 6 รายการ

  // ----------------------------------------------------------
  // ดึงข้อมูลรถ Featured (4 รายการ)
  // ----------------------------------------------------------
  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('is_active', true) // เฉพาะที่เปิดให้บริการ
    .order('created_at', { ascending: false }) // ล่าสุดก่อน
    .limit(4) // จำกัด 4 รายการ

  // ----------------------------------------------------------
  // ใช้ Mock Data ถ้าไม่มีข้อมูลจริง
  // ----------------------------------------------------------
  const displayHotels = (hotels && hotels.length > 0) ? hotels : MOCK_HOTELS
  const displayCars = (cars && cars.length > 0) ? cars : MOCK_CARS

  // ----------------------------------------------------------
  // Render Client Component
  // ----------------------------------------------------------
  return <HomeClient hotels={displayHotels} cars={displayCars} />
}
