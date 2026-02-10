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
    <Link href={`/hotels/${hotel.id}`}>
      <div className="group bg-white rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-300">
        {/* ============================================================ */}
        {/* ส่วนรูปภาพ */}
        {/* ============================================================ */}
        <div className="relative h-56 overflow-hidden">
          {/* รูปภาพโรงแรม - ใช้รูปแรกจาก array หรือ placeholder */}
          <Image
            src={hotel.images?.[0] || '/placeholder-hotel.jpg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Badge แสดงระดับดาว (มุมบนซ้าย) */}
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-bold text-slate-900">{hotel.star_rating}</span>
          </div>

          {/* Badge แสดงประเภทห้อง (มุมบนขวา) */}
          <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold">
            {roomType}
          </div>
        </div>

        {/* ============================================================ */}
        {/* ส่วนเนื้อหา */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-5">
          {/* ที่ตั้งโรงแรม พร้อมไอคอน MapPin */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 text-xs sm:text-sm mb-2">
            <MapPin size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span>{getField(hotel, 'location')}</span>
          </div>

          {/* ชื่อโรงแรม */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 line-clamp-1">{name}</h3>

          {/* คำอธิบาย - จำกัด 2 บรรทัด */}
          <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4">{description}</p>

          {/* ----------------------------------------------------------
              ส่วนล่าง: จำนวนผู้เข้าพัก และ ราคา
          ---------------------------------------------------------- */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
            {/* จำนวนผู้เข้าพักสูงสุด */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 text-xs sm:text-sm">
              <Users size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>
                {hotel.max_guests} {t('common.guests')}
              </span>
            </div>

            {/* ราคาต่อคืน */}
            <div className="text-right">
              <span className="text-base sm:text-lg font-bold text-indigo-600">
                {formatCurrency(hotel.price_per_night)}
              </span>
              <span className="text-slate-500 text-xs sm:text-sm">{t('common.perNight')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
