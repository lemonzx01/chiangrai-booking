/**
 * ============================================================
 * Car Detail Page - หน้ารายละเอียดรถเช่า (Server Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายละเอียดของรถแต่ละคัน
 *   - Generate Dynamic Metadata สำหรับ SEO
 *   - ดึงข้อมูลจาก Database ฝั่ง Server
 *
 * Route:
 *   - /cars/[id] - หน้ารายละเอียดรถ
 *
 * Dynamic Params:
 *   - id: UUID ของรถ
 *
 * การทำงาน:
 *   1. รับ id จาก URL params
 *   2. ดึงข้อมูลรถจาก Database
 *   3. ถ้าไม่พบ redirect ไป 404
 *   4. ส่งข้อมูลไปยัง CarDetailClient
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

/** Client component สำหรับแสดงรายละเอียดรถ */
import CarDetailClient from './CarDetailClient'

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
 *   สร้าง metadata แบบ dynamic ตามข้อมูลรถ
 *   ใช้สำหรับ title และ description ใน <head>
 *
 *   ขั้นตอน:
 *   1. ดึง id จาก params
 *   2. Query ข้อมูลรถจาก Database
 *   3. ถ้าไม่พบ return "Car Not Found"
 *   4. ถ้าพบ return ชื่อและรายละเอียดรถ
 *
 * @param {Props} props - Props ที่มี params
 * @returns {Promise<Metadata>} Metadata object สำหรับ Next.js
 */
export async function generateMetadata({ params }: Props) {
  // ดึง id จาก params (await เนื่องจากเป็น Promise)
  const { id } = await params

  // Fetch car from backend API
  const res = await fetch(`${getBackendUrl()}/api/cars/${id}`, {
    cache: 'no-store',
  })
  const json = await res.json()
  const car = json.data ?? json

  // ----------------------------------------------------------
  // Return Metadata
  // ----------------------------------------------------------
  // ถ้าไม่พบรถ
  if (!car || car.error) {
    return {
      title: 'Car Not Found | Got Journey Thailand',
    }
  }

  // ถ้าพบรถ - ใช้ชื่อและรายละเอียดภาษาอังกฤษ
  return {
    title: `${car.name_en} | Got Journey Thailand`,
    description: car.description_en,
  }
}

// ============================================================
// Page Component - Server Component
// ============================================================

/**
 * หน้ารายละเอียดรถเช่า
 *
 * @description
 *   Server Component ที่ดึงข้อมูลรถตาม ID
 *   และส่งต่อให้ Client Component
 *
 *   ขั้นตอนการทำงาน:
 *   1. ดึง id จาก URL params
 *   2. Query ข้อมูลรถจาก Database
 *   3. ถ้าไม่พบหรือ error -> แสดงหน้า 404
 *   4. ถ้าพบ -> Render CarDetailClient
 *
 * @param {Props} props - Props ที่มี params
 * @returns {Promise<JSX.Element>} CarDetailClient component
 *
 * @throws {NotFound} ถ้าไม่พบรถ จะ redirect ไปหน้า 404
 */
export default async function CarDetailPage({ params }: Props) {
  // ดึง id จาก params
  const { id } = await params

  const res = await fetch(`${getBackendUrl()}/api/cars/${id}`, {
    cache: 'no-store',
  })
  const json = await res.json()
  const car = json.data ?? json

  if (!res.ok || !car || car.error) {
    notFound()
  }

  // ----------------------------------------------------------
  // Render Client Component
  // ----------------------------------------------------------
  return <CarDetailClient car={car} />
}
