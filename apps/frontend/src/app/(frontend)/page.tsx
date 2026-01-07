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

import { getBackendUrl } from '@/lib/api'

/** Client component สำหรับแสดงหน้าแรก */
import HomeClient from './HomeClient'


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
  const backendUrl = getBackendUrl()
  
  const [hotelsRes, carsRes] = await Promise.all([
    fetch(`${backendUrl}/api/hotels?is_active=true&limit=6`, { cache: 'no-store' }),
    fetch(`${backendUrl}/api/cars?is_active=true&limit=4`, { cache: 'no-store' }),
  ])

  const hotelsJson = (await hotelsRes.json()) as { data?: any[]; error?: string }
  const carsJson = (await carsRes.json()) as { data?: any[]; error?: string }

  const displayHotels = hotelsRes.ok ? (hotelsJson.data || []) : []
  const displayCars = carsRes.ok ? (carsJson.data || []) : []

  return <HomeClient hotels={displayHotels} cars={displayCars} />
}
