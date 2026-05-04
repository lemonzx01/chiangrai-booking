/**
 * ============================================================
 * CarCard Component - การ์ดแสดงข้อมูลรถเช่า
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงข้อมูลรถเช่าในรูปแบบการ์ดที่สวยงาม
 *   - รองรับการแสดงผลสองภาษา (ไทย/อังกฤษ)
 *   - มี Animation เมื่อ hover สำหรับ UX ที่ดี
 *   - แสดงข้อมูลสำคัญ: รูป, ชื่อ, ประเภท, สิ่งที่รวม, ราคา
 *
 * ฟังก์ชันหลัก:
 *   - CarCard: Component หลักสำหรับแสดงการ์ดรถเช่า
 *
 * การใช้งาน:
 *   <CarCard car={carData} />
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
import { Users, Check } from 'lucide-react'

// ----------------------------------------------------------
// Types และ Utilities
// ----------------------------------------------------------
/** Type สำหรับข้อมูลรถเช่า */
import { Car } from '@chiangrai/shared/types'

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
 * Props สำหรับ CarCard Component
 *
 * @interface CarCardProps
 * @property {Car} car - ข้อมูลรถเช่าที่จะแสดง
 */
interface CarCardProps {
  car: Car
}

// ============================================================
// Component
// ============================================================

/**
 * CarCard Component - การ์ดแสดงข้อมูลรถเช่า
 *
 * @description
 *   แสดงข้อมูลรถเช่าในรูปแบบการ์ดที่มี:
 *   - รูปภาพรถพร้อม Badge ประเภทรถ
 *   - ชื่อและคำอธิบายรถ
 *   - รายการสิ่งที่รวมอยู่ในราคา (สูงสุด 3 รายการ)
 *   - จำนวนผู้โดยสารและราคาต่อวัน
 *
 * @param {CarCardProps} props - Props ที่รับเข้ามา
 * @param {Car} props.car - ข้อมูลรถเช่า
 *
 * @returns {JSX.Element} การ์ดแสดงข้อมูลรถเช่า
 *
 * @example
 *   // การใช้งานพื้นฐาน
 *   <CarCard car={carData} />
 *
 *   // ใช้ในรายการรถเช่า
 *   {cars.map(car => (
 *     <CarCard key={car.id} car={car} />
 *   ))}
 */
export default function CarCard({ car }: CarCardProps) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------

  /** ฟังก์ชันสำหรับดึงข้อมูลตามภาษาปัจจุบัน */
  const { getField, getArrayField } = useLocalize()

  /** ฟังก์ชันแปลภาษา */
  const { t } = useTranslation()

  // ----------------------------------------------------------
  // การแปลข้อมูลตามภาษา
  // ----------------------------------------------------------

  /** ชื่อรถ (ไทย/อังกฤษ ตามภาษาปัจจุบัน) */
  const name = getField(car, 'name')

  /** คำอธิบายรถ */
  const description = getField(car, 'description')

  /** ประเภทรถ (เก๋ง, SUV, Van ฯลฯ) */
  const carType = getField(car, 'car_type')

  /** รายการสิ่งที่รวมในราคา */
  const includes = getArrayField(car, 'includes')

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <Link href={`/cars/${car.id}`} className="block group focus-ring rounded-xl">
      <div className="card-premium bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Image — only the wishlist heart sits over it now.
            The car-type label moved inline below as an eyebrow,
            same pattern as HotelCard. */}
        <div className="relative h-56 overflow-hidden bg-slate-100">
          <Image
            src={car.images?.[0] || '/placeholder-car.jpg'}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover img-zoom"
            placeholder="blur"
            blurDataURL={SHIMMER_DATA_URL}
          />
          <WishlistButton kind="car" id={car.id} />
        </div>

        {/* Content — eyebrow (car type) → title → description →
            included pills → metadata + price. */}
        <div className="p-5">
          {carType && (
            <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
              {carType}
            </div>
          )}

          <h3 className="font-display text-lg font-medium text-slate-900 mb-2 line-clamp-1 tracking-tight">
            {name}
          </h3>

          <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>

          {/* Included items — quieter pills (no colored check
              icon, content-first). */}
          {includes && includes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {includes.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full"
                >
                  <Check size={10} className="text-slate-500" />
                  {item}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Users size={12} />
              <span>
                {car.max_passengers} {t('common.passengers')}
              </span>
            </div>

            <div className="text-right">
              <span className="text-lg font-semibold text-slate-900 tracking-tight">
                {formatCurrency(car.price_per_day)}
              </span>
              <span className="text-slate-400 text-xs ml-0.5">{t('common.perDay')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
