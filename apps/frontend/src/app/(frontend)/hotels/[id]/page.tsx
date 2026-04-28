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
import type { Metadata } from 'next'

/** Next.js utility สำหรับแสดงหน้า 404 */
import { notFound } from 'next/navigation'

/** Client component สำหรับแสดงรายละเอียดโรงแรม */
import HotelDetailClient from './HotelDetailClient'

/** JSON-LD builders for rich Google results */
import {
  buildHotelSchema,
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
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const res = await fetch(`${getBackendUrl()}/api/hotels/${id}`, {
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({}))
  const hotel = json.hotel ?? json.data ?? json

  if (!hotel || hotel.error || !hotel.id) {
    return {
      title: 'ไม่พบโรงแรม / Hotel not found',
      robots: { index: false, follow: false },
    }
  }

  // Title: bilingual where possible — Thai-first audience plus
  // English fallback for inbound search traffic.
  const titleTh = hotel.name_th || ''
  const titleEn = hotel.name_en || ''
  const title = titleTh && titleEn && titleTh !== titleEn
    ? `${titleTh} — ${titleEn}`
    : titleTh || titleEn || 'โรงแรม'

  // Description: prefer Thai for in-country SEO, fall back to English.
  // Trim to 158 chars — Google truncates around 160.
  const rawDesc =
    hotel.description_th || hotel.description_en || ''
  const description =
    rawDesc.length > 158 ? rawDesc.slice(0, 155).trimEnd() + '...' : rawDesc

  const images: string[] = Array.isArray(hotel.images) ? hotel.images.slice(0, 4) : []

  return {
    title,
    description,
    alternates: {
      canonical: `/hotels/${id}`,
      languages: {
        th: `/hotels/${id}`,
        en: `/hotels/${id}`,
      },
    },
    openGraph: {
      type: 'website',
      url: `/hotels/${id}`,
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
  const { id } = await params

  const res = await fetch(`${getBackendUrl()}/api/hotels/${id}`, {
    cache: 'no-store',
  })
  const json = await res.json()
  const hotel = json.hotel ?? json.data ?? json

  if (!res.ok || !hotel || hotel.error) {
    notFound()
  }

  // Build structured data for the @graph approach — Google
  // recommends one JSON-LD blob with multiple types over
  // separate <script> tags per type.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildHotelSchema({
        id: hotel.id,
        name: hotel.name_en || hotel.name_th || 'Hotel',
        alternateName:
          hotel.name_th && hotel.name_th !== hotel.name_en
            ? hotel.name_th
            : undefined,
        description: hotel.description_en || hotel.description_th || '',
        images: Array.isArray(hotel.images) ? hotel.images : [],
        location:
          hotel.location ||
          hotel.location_en ||
          hotel.location_th ||
          null,
        starRating: hotel.star_rating || null,
        pricePerNight:
          Number(hotel.base_price_per_night || hotel.price_per_night) || 0,
      }),
      buildBreadcrumbSchema([
        { name: 'หน้าแรก', url: '/' },
        { name: 'โรงแรม', url: '/hotels' },
        { name: hotel.name_th || hotel.name_en || 'Hotel', url: `/hotels/${id}` },
      ]),
    ],
  }

  return (
    <>
      {/* Inline JSON-LD: Google reads this directly without
          waiting for client JS, and it's the standard way to
          ship structured data for Hotel + Breadcrumb. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HotelDetailClient hotel={hotel} />
    </>
  )
}
