/**
 * ============================================================
 * Hotel Detail Page - หน้ารายละเอียดโรงแรม (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายละเอียดของโรงแรมแต่ละแห่ง
 *   - Generate Dynamic Metadata สำหรับ SEO
 *   - ดึงข้อมูลจาก Database ฝั่ง Server
 *
 * Route:
 *   - /hotels/[id] - หน้ารายละเอียดโรงแรม
 *
 * Dynamic Params:
 *   - id: UUID ของโรงแรม
 *
 * การทำงาน:
 *   1. รับ id จาก URL params
 *   2. ดึงข้อมูลโรงแรมจาก Database
 *   3. ถ้าไม่พบ redirect ไป 404
 *   4. ส่งข้อมูลไปยัง HotelDetailClient
 *
 * Note:
 *   - ใช้ generateMetadata สำหรับ Dynamic SEO
 *   - notFound() จะ redirect ไปหน้า 404
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

import { getBackendUrl } from '@/lib/api'

/** Next.js utility สำหรับแสดงหน้า 404 */
import { notFound } from 'next/navigation'

/** Client component สำหรับแสดงรายละเอียดโรงแรม */
import HotelDetailClient from './HotelDetailClient'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Props interface สำหรับ Page Component
 *
 * @property {Promise<{ id: string }>} params - Dynamic route parameters
 *
 * @note Next.js 14 ใช้ Promise สำหรับ params
 */
interface Props {
  params: Promise<{ id: string }>
}

// ============================================================
// Dynamic Metadata Generation
// ============================================================

/**
 * Generate Dynamic Metadata สำหรับ SEO
 *
 * @description
 *   สร้าง metadata แบบ dynamic ตามข้อมูลโรงแรม
 *   ใช้สำหรับ title และ description ใน <head>
 *
 *   ขั้นตอน:
 *   1. ดึง id จาก params
 *   2. Query ข้อมูลโรงแรมจาก Database
 *   3. ถ้าไม่พบ return "Hotel Not Found"
 *   4. ถ้าพบ return ชื่อและรายละเอียดโรงแรม
 *
 * @param {Props} props - Props ที่มี params
 * @returns {Promise<Metadata>} Metadata object สำหรับ Next.js
 */
export async function generateMetadata({ params }: Props) {
  // ดึง id จาก params (await เนื่องจากเป็น Promise)
  const { id } = await params

  const res = await fetch(`${getBackendUrl()}/api/hotels/${id}`, {
    cache: 'no-store',
  })
  const json = await res.json()
  const hotel = json.hotel ?? json.data ?? json

  // ----------------------------------------------------------
  // Return Metadata
  // ----------------------------------------------------------
  // ถ้าไม่พบโรงแรม
  if (!hotel || hotel.error) {
    return {
      title: 'Hotel Not Found | Got Journey Thailand',
    }
  }

  // ถ้าพบโรงแรม - ใช้ชื่อและรายละเอียดภาษาอังกฤษ
  return {
    title: `${hotel.name_en} | Got Journey Thailand`,
    description: hotel.description_en,
  }
}

// ============================================================
// Page Component - Server Component
// ============================================================

/**
 * หน้ารายละเอียดโรงแรม
 *
 * @description
 *   Server Component ที่ดึงข้อมูลโรงแรมตาม ID
 *   และส่งต่อให้ Client Component
 *
 *   ขั้นตอนการทำงาน:
 *   1. ดึง id จาก URL params
 *   2. Query ข้อมูลโรงแรมจาก Database
 *   3. ถ้าไม่พบหรือ error -> แสดงหน้า 404
 *   4. ถ้าพบ -> Render HotelDetailClient
 *
 * @param {Props} props - Props ที่มี params
 * @returns {Promise<JSX.Element>} HotelDetailClient component
 *
 * @throws {NotFound} ถ้าไม่พบโรงแรม จะ redirect ไปหน้า 404
 */
export default async function HotelDetailPage({ params }: Props) {
  // ดึง id จาก params
  const { id } = await params

  const res = await fetch(`${getBackendUrl()}/api/hotels/${id}`, {
    cache: 'no-store',
  })
  const json = await res.json()
  const hotel = json.hotel ?? json.data ?? json

  if (!res.ok || !hotel || hotel.error) {
    notFound()
  }

  // ----------------------------------------------------------
  // Render Client Component
  // ----------------------------------------------------------
  return <HotelDetailClient hotel={hotel} />
}
