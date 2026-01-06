/**
 * ============================================================
 * Hotels Page - หน้ารายการโรงแรมและแพ็คเกจที่พัก (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการโรงแรมและแพ็คเกจที่พักทั้งหมด
 *   - ดึงข้อมูลจาก Database ฝั่ง Server (SEO-friendly)
 *   - ใช้ Mock Data เมื่อไม่มีข้อมูลในฐานข้อมูล
 *
 * Route:
 *   - /hotels - หน้ารายการโรงแรม
 *
 * การทำงาน:
 *   1. สร้าง Supabase client สำหรับ Server
 *   2. ดึงข้อมูลโรงแรมที่ active จาก Database
 *   3. ถ้าไม่มีข้อมูล ใช้ MOCK_HOTELS แทน
 *   4. ส่งข้อมูลไปยัง HotelsClient component
 *
 * Note:
 *   - เป็น Server Component เพื่อให้ SEO ดี
 *   - Client-side interactions อยู่ใน HotelsClient
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase client สำหรับ Server-side */
import { createClient } from '@/lib/supabase/server'

/** Client component สำหรับแสดงรายการโรงแรม */
import HotelsClient from './HotelsClient'

/** ข้อมูล Mock โรงแรม สำหรับ Development */
import { MOCK_HOTELS } from '@/lib/constants'

// ============================================================
// Metadata สำหรับ SEO
// ============================================================

/**
 * Metadata ของหน้า Hotels
 *
 * @description
 *   กำหนด title และ description สำหรับ SEO
 *   จะถูกใช้โดย Next.js ในการสร้าง <head> tags
 */
export const metadata = {
  title: 'Hotels & Packages | Got Journey Thailand',
  description: 'Browse our exclusive hotel packages and villa stays',
}

// ============================================================
// Page Component - Server Component
// ============================================================

/**
 * หน้ารายการโรงแรมและแพ็คเกจที่พัก
 *
 * @description
 *   Server Component ที่ดึงข้อมูลโรงแรมจาก Database
 *   และส่งต่อให้ Client Component เพื่อแสดงผล
 *
 *   ขั้นตอนการทำงาน:
 *   1. สร้าง Supabase client
 *   2. Query ข้อมูลโรงแรมที่ is_active = true
 *   3. เรียงตามวันที่สร้าง (ล่าสุดก่อน)
 *   4. ถ้าไม่มีข้อมูลจริง ใช้ Mock Data
 *   5. Render HotelsClient พร้อมข้อมูล
 *
 * @returns {Promise<JSX.Element>} HotelsClient component พร้อมข้อมูลโรงแรม
 */
export default async function HotelsPage() {
  // สร้าง Supabase client สำหรับ Server
  const supabase = await createClient()

  // ----------------------------------------------------------
  // ดึงข้อมูลโรงแรมจาก Database
  // ----------------------------------------------------------
  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .eq('is_active', true) // เฉพาะโรงแรมที่เปิดให้บริการ
    .order('created_at', { ascending: false }) // เรียงตามวันที่ (ล่าสุดก่อน)

  // ----------------------------------------------------------
  // ใช้ Mock Data ถ้าไม่มีข้อมูลในฐานข้อมูล
  // ----------------------------------------------------------
  // ป้องกันกรณี Database ว่าง หรือยังไม่ได้ setup
  const displayHotels = (hotels && hotels.length > 0) ? hotels : MOCK_HOTELS

  // ----------------------------------------------------------
  // Render Client Component
  // ----------------------------------------------------------
  return <HotelsClient hotels={displayHotels} />
}
