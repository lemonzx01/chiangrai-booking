/**
 * ============================================================
 * HotelCard Component - การ์ดแสดงข้อมูลโรงแรม
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงข้อมูลโรงแรมในรูปแบบการ์ดที่สวยงาม
 *   - รองรับการแสดงผลสองภาษา (ไทย/อังกฤษ)
 *   - มี Animation เมื่อ hover สำหรับ UX ที่ดี
 *   - แสดงข้อมูลสำคัญ: รูป, ดาว, ประเภทห้อง, ที่ตั้ง, ราคา
 *
 * ฟังก์ชันหลัก:
 *   - HotelCard: Component หลักสำหรับแสดงการ์ดโรงแรม
 *
 * การใช้งาน:
 *   <HotelCard hotel={hotelData} />
 *
 * Dependencies:
 *   - next/link: สำหรับ Client-side navigation
 *   - next/image: สำหรับ Optimized images
 *   - lucide-react: สำหรับไอคอน
 *   - useLocalize: Hook สำหรับดึงข้อมูลตามภาษา
 *   - react-i18next: สำหรับแปลภาษา
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

// ----------------------------------------------------------
// Next.js Components
// ----------------------------------------------------------
import Link from 'next/link'
import Image from 'next/image'

// ----------------------------------------------------------
// Icons
// ----------------------------------------------------------
/** ไอคอนดาว - แสดงระดับดาวโรงแรม */
import { Star, MapPin, Users } from 'lucide-react'

// ----------------------------------------------------------
// Types และ Utilities
// ----------------------------------------------------------
/** Type สำหรับข้อมูลโรงแรม */
import { Hotel } from '@chiangrai/shared/types'

/** ฟังก์ชันจัดรูปแบบสกุลเงิน */
import { formatCurrency } from '@chiangrai/shared/utils'

// ----------------------------------------------------------
// Hooks
// ----------------------------------------------------------
/** Hook สำหรับดึงข้อมูลตามภาษาปัจจุบัน */
import useLocalize from '@/hooks/useLocalize'

/** Hook สำหรับการแปลภาษา */
import { useTranslation } from 'react-i18next'

/** Blur placeholder data-URL */
import { SHIMMER_DATA_URL } from '@/lib/blurPlaceholder'

/** Wishlist heart toggle */
import WishlistButton from '@/components/shared/WishlistButton'

// ============================================================
// Interface Definitions
// ============================================================

/**
 * Props สำหรับ HotelCard Component
 *
 * @interface HotelCardProps
 * @property {Hotel} hotel - ข้อมูลโรงแรมที่จะแสดง
 */
interface HotelCardProps {
  hotel: Hotel
}

// ============================================================
// Component
// ============================================================

/**
 * HotelCard Component - การ์ดแสดงข้อมูลโรงแรม
 *
 * @description
 *   แสดงข้อมูลโรงแรมในรูปแบบการ์ดที่มี:
 *   - รูปภาพโรงแรมพร้อม Badge ระดับดาวและประเภทห้อง
 *   - ที่ตั้งพร้อมไอคอน MapPin
 *   - ชื่อและคำอธิบายโรงแรม
 *   - จำนวนผู้เข้าพักและราคาต่อคืน
 *
 * @param {HotelCardProps} props - Props ที่รับเข้ามา
 * @param {Hotel} props.hotel - ข้อมูลโรงแรม
 *
 * @returns {JSX.Element} การ์ดแสดงข้อมูลโรงแรม
 *
 * @example
 *   // การใช้งานพื้นฐาน
 *   <HotelCard hotel={hotelData} />
 *
 *   // ใช้ในรายการโรงแรม
 *   {hotels.map(hotel => (
 *     <HotelCard key={hotel.id} hotel={hotel} />
 *   ))}
 */
export default function HotelCard({ hotel }: HotelCardProps) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------

  /** ฟังก์ชันสำหรับดึงข้อมูลตามภาษาปัจจุบัน */
  const { getField } = useLocalize()

  /** ฟังก์ชันแปลภาษา */
  const { t } = useTranslation()

  // ----------------------------------------------------------
  // การแปลข้อมูลตามภาษา
  // ----------------------------------------------------------

  /** ชื่อโรงแรม (ไทย/อังกฤษ ตามภาษาปัจจุบัน) */
  const name = getField(hotel, 'name')

  /** คำอธิบายโรงแรม */
  const description = getField(hotel, 'description')

  /** ประเภทห้อง (Standard, Deluxe, Suite ฯลฯ) */
  const roomType = getField(hotel, 'room_type')

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <Link href={`/hotels/${hotel.id}`} className="block group focus-ring rounded-xl">
      <div className="card-premium bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Image — only the wishlist heart and a quiet star pill
            sit on top now. The colored room-type badge moved
            inline below; that data point doesn't earn an
            attention-grabbing position over the photo. */}
        <div className="relative h-56 overflow-hidden">
          <Image
            src={hotel.images?.[0] || '/placeholder-hotel.jpg'}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover img-zoom"
            placeholder="blur"
            blurDataURL={SHIMMER_DATA_URL}
          />

          <WishlistButton kind="hotel" id={hotel.id} />

          {/* Quiet star pill — no shadow, slightly transparent so
              the image still reads through. */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full">
            <Star size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold text-slate-900">{hotel.star_rating}</span>
          </div>
        </div>

        {/* Content — typography-led hierarchy: location label
            (eyebrow) → name (title) → description (body) →
            metadata row. Price is a plain typographic element,
            not a colored callout. */}
        <div className="p-5">
          {/* Eyebrow: location + room type, both as quiet labels */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 uppercase tracking-wide">
            <MapPin size={11} />
            <span>{getField(hotel, 'location')}</span>
            {roomType && (
              <>
                <span className="text-slate-300">·</span>
                <span className="normal-case tracking-normal">{roomType}</span>
              </>
            )}
          </div>

          <h3 className="font-display text-lg font-medium text-slate-900 mb-2 line-clamp-1 tracking-tight">
            {name}
          </h3>

          <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>

          <div className="flex items-end justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Users size={12} />
              <span>
                {hotel.max_guests} {t('common.guests')}
              </span>
            </div>

            {/* Price — slate-900 not indigo. Per-night unit smaller
                + lower-weight so the eye lands on the number
                first, then the unit clarifies. */}
            <div className="text-right">
              <span className="text-lg font-semibold text-slate-900 tracking-tight">
                {formatCurrency(hotel.price_per_night)}
              </span>
              <span className="text-slate-400 text-xs ml-0.5">{t('common.perNight')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
