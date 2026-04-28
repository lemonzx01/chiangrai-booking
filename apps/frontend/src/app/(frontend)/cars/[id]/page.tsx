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
import type { Metadata } from 'next'

/** Next.js utility สำหรับแสดงหน้า 404 */
import { notFound } from 'next/navigation'

/** Client component สำหรับแสดงรายละเอียดรถ */
import CarDetailClient from './CarDetailClient'

/** JSON-LD builders for rich Google results */
import {
  buildCarSchema,
  buildBreadcrumbSchema,
} from '@/lib/structuredData'

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
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const res = await fetch(`${getBackendUrl()}/api/cars/${id}`, {
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({}))
  const car = json.data ?? json

  if (!car || car.error || !car.id) {
    return {
      title: 'ไม่พบรถ / Car not found',
      robots: { index: false, follow: false },
    }
  }

  const titleTh = car.name_th || ''
  const titleEn = car.name_en || ''
  const title = titleTh && titleEn && titleTh !== titleEn
    ? `${titleTh} — ${titleEn}`
    : titleTh || titleEn || 'รถเช่า'

  const rawDesc = car.description_th || car.description_en || ''
  const description =
    rawDesc.length > 158 ? rawDesc.slice(0, 155).trimEnd() + '...' : rawDesc

  const images: string[] = Array.isArray(car.images) ? car.images.slice(0, 4) : []

  return {
    title,
    description,
    alternates: {
      canonical: `/cars/${id}`,
      languages: {
        th: `/cars/${id}`,
        en: `/cars/${id}`,
      },
    },
    openGraph: {
      type: 'website',
      url: `/cars/${id}`,
      title,
      description,
      images: images.length > 0 ? images.map((url) => ({ url })) : undefined,
      locale: 'th_TH',
      alternateLocale: ['en_US'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.slice(0, 1),
    },
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
  const { id } = await params

  const res = await fetch(`${getBackendUrl()}/api/cars/${id}`, {
    cache: 'no-store',
  })
  const json = await res.json()
  const car = json.data ?? json

  if (!res.ok || !car || car.error) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildCarSchema({
        id: car.id,
        name: car.name_en || car.name_th || 'Car rental',
        alternateName:
          car.name_th && car.name_th !== car.name_en
            ? car.name_th
            : undefined,
        description: car.description_en || car.description_th || '',
        images: Array.isArray(car.images) ? car.images : [],
        carType: car.car_type_en || car.car_type_th || null,
        passengers: car.max_passengers || null,
        pricePerDay:
          Number(car.base_price_per_day || car.price_per_day) || 0,
      }),
      buildBreadcrumbSchema([
        { name: 'หน้าแรก', url: '/' },
        { name: 'รถเช่า', url: '/cars' },
        { name: car.name_th || car.name_en || 'Car', url: `/cars/${id}` },
      ]),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CarDetailClient car={car} />
    </>
  )
}
