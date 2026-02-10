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
    <Link href={`/cars/${car.id}`}>
      <div className="group bg-white rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-300">
        {/* ============================================================ */}
        {/* ส่วนรูปภาพ */}
        {/* ============================================================ */}
        <div className="relative h-56 overflow-hidden bg-slate-100">
          {/* รูปภาพรถ - ใช้รูปแรกจาก array หรือ placeholder */}
          <Image
            src={car.images?.[0] || '/placeholder-car.jpg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Badge แสดงประเภทรถ (มุมบนขวา) */}
          <div className="absolute top-4 right-4 bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold">
            {carType}
          </div>
        </div>

        {/* ============================================================ */}
        {/* ส่วนเนื้อหา */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-5">
          {/* ชื่อรถ */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 line-clamp-1">{name}</h3>

          {/* คำอธิบาย - จำกัด 2 บรรทัด */}
          <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4">{description}</p>

          {/* ----------------------------------------------------------
              รายการสิ่งที่รวมในราคา
              - แสดงสูงสุด 3 รายการ
              - แต่ละรายการมีไอคอน Check สีเขียว
          ---------------------------------------------------------- */}
          <div className="flex flex-wrap gap-2 mb-4">
            {includes?.slice(0, 3).map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full"
              >
                <Check size={12} className="text-green-500" />
                {item}
              </span>
            ))}
          </div>

          {/* ----------------------------------------------------------
              ส่วนล่าง: จำนวนผู้โดยสาร และ ราคา
          ---------------------------------------------------------- */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
            {/* จำนวนผู้โดยสารสูงสุด */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 text-xs sm:text-sm">
              <Users size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>
                {car.max_passengers} {t('common.passengers')}
              </span>
            </div>

            {/* ราคาต่อวัน */}
            <div className="text-right">
              <span className="text-base sm:text-lg font-bold text-indigo-600">
                {formatCurrency(car.price_per_day)}
              </span>
              <span className="text-slate-500 text-xs sm:text-sm">{t('common.perDay')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
