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

type PageSearchParams = Record<string, string | string[] | undefined>

function getFirstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
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
export default async function HotelsPage({
  searchParams,
}: {
  searchParams?: PageSearchParams
}) {
  const q = getFirstParam(searchParams?.q)?.trim()
  const location = getFirstParam(searchParams?.location)?.trim()
  const price = getFirstParam(searchParams?.price)
  const star = getFirstParam(searchParams?.star)
  const sort = getFirstParam(searchParams?.sort) || 'newest'

  const query = new URLSearchParams({
    limit: '100',
    sort,
  })

  if (q) query.set('q', q)
  if (location) query.set('location', location)

  if (price === 'low') {
    query.set('min_price', '0')
    query.set('max_price', '20000')
  } else if (price === 'mid') {
    query.set('min_price', '20000')
    query.set('max_price', '40000')
  } else if (price === 'high') {
    query.set('min_price', '40000')
  }

  const starNum = Number(star)
  if (star && !Number.isNaN(starNum) && starNum > 0) {
    query.set('min_star', String(starNum))
  }

  const [filteredRes, allRes] = await Promise.all([
    fetch(`${getBackendUrl()}/api/hotels?${query.toString()}`, {
      cache: 'no-store',
    }),
    fetch(`${getBackendUrl()}/api/hotels?limit=100`, {
      cache: 'no-store',
    }),
  ])

  const filteredJson = (await filteredRes.json()) as { data?: any[]; error?: string }
  const allJson = (await allRes.json()) as { data?: any[]; error?: string }

  if (!filteredRes.ok) {
    console.error(filteredJson.error || 'Failed to fetch hotels')
    return (
      <HotelsClient
        hotels={[]}
        initialFilters={{
          q,
          location,
          price,
          star,
          sort,
        }}
        allLocations={[]}
      />
    )
  }

  const allHotels = Array.isArray(allJson.data) ? allJson.data : []
  const allLocations = [
    ...new Set(
      allHotels
        .map((hotel) => hotel.location || hotel.location_th || hotel.location_en)
        .filter(Boolean)
    ),
  ] as string[]

  return (
    <HotelsClient
      hotels={(filteredJson.data as any[]) || []}
      initialFilters={{
        q,
        location,
        price,
        sort,
      }}
      allLocations={allLocations}
    />
  )
}
