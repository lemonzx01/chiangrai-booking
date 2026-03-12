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

import { getBackendUrl } from '@/lib/api'

/** Client component สำหรับแสดงรายการรถ */
import CarsClient from './CarsClient'


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

type PageSearchParams = Record<string, string | string[] | undefined>

function getFirstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
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
export default async function CarsPage({
  searchParams,
}: {
  searchParams?: PageSearchParams
}) {
  const q = getFirstParam(searchParams?.q)?.trim()
  const carType = getFirstParam(searchParams?.car_type)?.trim()
  const sort = getFirstParam(searchParams?.sort) || 'newest'

  const query = new URLSearchParams({
    limit: '100',
    sort,
  })

  if (q) query.set('q', q)
  if (carType) query.set('car_type', carType)

  const [filteredRes, allRes] = await Promise.all([
    fetch(`${getBackendUrl()}/api/cars?${query.toString()}`, {
      cache: 'no-store',
    }),
    fetch(`${getBackendUrl()}/api/cars?limit=100`, {
      cache: 'no-store',
    }),
  ])

  const filteredJson = (await filteredRes.json()) as { data?: any[]; error?: string }
  const allJson = (await allRes.json()) as { data?: any[]; error?: string }

  if (!filteredRes.ok) {
    console.error(filteredJson.error || 'Failed to fetch cars')
    return (
      <CarsClient
        cars={[]}
        initialFilters={{
          q,
          car_type: carType,
          sort,
        }}
        allCarTypes={[]}
      />
    )
  }

  const allCars = Array.isArray(allJson.data) ? allJson.data : []
  const allCarTypes = [
    ...new Set(
      allCars
        .map((car) => car.car_type_th || car.car_type_en)
        .filter(Boolean)
    ),
  ] as string[]

  return (
    <CarsClient
      cars={(filteredJson.data as any[]) || []}
      initialFilters={{
        q,
        car_type: carType,
        sort,
      }}
      allCarTypes={allCarTypes}
    />
  )
}
