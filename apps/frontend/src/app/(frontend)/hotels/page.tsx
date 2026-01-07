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

import { getBackendUrl } from '@/lib/api'

/** Client component สำหรับแสดงรายการโรงแรม */
import HotelsClient from './HotelsClient'


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
  const res = await fetch(`${getBackendUrl()}/api/hotels?is_active=true`, {
    cache: 'no-store',
  })
  const json = (await res.json()) as { data?: any[]; error?: string }

  if (!res.ok) {
    console.error(json.error || 'Failed to fetch hotels')
    return <HotelsClient hotels={[]} />
  }

  return <HotelsClient hotels={(json.data as any[]) || []} />
}
