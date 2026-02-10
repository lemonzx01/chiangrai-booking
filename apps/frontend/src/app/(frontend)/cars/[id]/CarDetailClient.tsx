/**
 * ============================================================
 * Car Detail Client - หน้ารายละเอียดรถเช่า (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายละเอียดรถพร้อม Image Gallery
 *   - รองรับการเปลี่ยนภาษา (Thai/English)
 *   - มีปุ่มจองรถที่ link ไปหน้า Booking
 *
 * Features:
 *   - Image Gallery พร้อม Thumbnail
 *   - ประเภทรถ (SUV, Sedan, Van, etc.)
 *   - รายการสิ่งที่รวมในแพ็คเกจ
 *   - ข้อมูลจำนวนผู้โดยสารสูงสุด
 *   - ราคาต่อวันและปุ่มจอง
 *
 * การใช้งาน:
 *   <CarDetailClient car={carData} />
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state */
import { useState } from 'react'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Next.js components */
import Link from 'next/link'
import Image from 'next/image'

/** Lucide icons สำหรับ UI */
import { Users, Check, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

/** Type definition สำหรับข้อมูลรถ */
import { Car } from '@chiangrai/shared/types'

/** Utility function สำหรับ format ราคา */
import { formatCurrency } from '@chiangrai/shared/utils'

/** Custom hook สำหรับดึงข้อมูลตามภาษา */
import useLocalize from '@/hooks/useLocalize'

/** UI Components */
import Button from '@/components/ui/Button'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Props interface สำหรับ CarDetailClient
 *
 * @property {Car} car - ข้อมูลรถที่จะแสดง
 */
interface CarDetailClientProps {
  car: Car
}

// ============================================================
// Main Component
// ============================================================

/**
 * Client Component สำหรับแสดงรายละเอียดรถ
 *
 * @description
 *   Component หลักสำหรับแสดงข้อมูลรถอย่างละเอียด
 *   มี Image Gallery ที่สลับรูปได้ และข้อมูลต่างๆ ของรถ
 *
 *   โครงสร้าง UI:
 *   - ปุ่มกลับไปหน้ารายการ
 *   - Image Gallery (ซ้าย) + รายละเอียด (ขวา)
 *   - ประเภทรถ, ชื่อ, รายละเอียด
 *   - สิ่งที่รวมในแพ็คเกจ
 *   - ราคาและปุ่มจอง
 *
 * @param {CarDetailClientProps} props - Props ที่มีข้อมูลรถ
 * @returns {JSX.Element} Car detail UI
 *
 * @example
 *   <CarDetailClient car={carData} />
 */
export default function CarDetailClient({ car }: CarDetailClientProps) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t } = useTranslation()

  /** Hook สำหรับดึงข้อมูลตามภาษาปัจจุบัน */
  const { getField, getArrayField } = useLocalize()

  /** State สำหรับ index ของรูปที่แสดงอยู่ */
  const [currentImage, setCurrentImage] = useState(0)

  /** รูปภาพ (fallback เป็น array ว่างถ้าไม่มี) */
  const images = car.images || []

  // ----------------------------------------------------------
  // ดึงข้อมูลตามภาษาปัจจุบัน
  // ----------------------------------------------------------
  /** ชื่อรถตามภาษา */
  const name = getField(car, 'name')

  /** รายละเอียดรถตามภาษา */
  const description = getField(car, 'description')

  /** ประเภทรถตามภาษา */
  const carType = getField(car, 'car_type')

  /** รายการสิ่งที่รวมในแพ็คเกจตามภาษา */
  const includes = getArrayField(car, 'includes')

  // ----------------------------------------------------------
  // Image Gallery Navigation Functions
  // ----------------------------------------------------------
  /**
   * ไปรูปถัดไป
   *
   * @description
   *   เลื่อน index ไปรูปถัดไป
   *   ถ้าอยู่รูปสุดท้ายจะวนกลับไปรูปแรก
   */
  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length)
  }

  /**
   * ไปรูปก่อนหน้า
   *
   * @description
   *   เลื่อน index ไปรูปก่อนหน้า
   *   ถ้าอยู่รูปแรกจะวนกลับไปรูปสุดท้าย
   */
  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length)
  }

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================================
            ปุ่มกลับไปหน้ารายการรถ
            ============================================================ */}
        <Link
          href="/cars"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{t('common.back')}</span>
        </Link>

        {/* ============================================================
            Main Content - 2 Columns Grid
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* ============================================================
              คอลัมน์ซ้าย - Image Gallery
              ============================================================ */}
          <div className="space-y-4">
            {/* รูปหลัก */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
              <Image
                src={images[currentImage] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70'}
                alt={name}
                fill
                className="object-cover"
              />

              {/* ปุ่มเลื่อนรูป - แสดงเมื่อมีมากกว่า 1 รูป */}
              {images.length > 1 && (
                <>
                  {/* ปุ่มรูปก่อนหน้า */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  {/* ปุ่มรูปถัดไป */}
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery - แสดงเมื่อมีมากกว่า 1 รูป */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all ${
                      idx === currentImage ? 'ring-2 ring-indigo-600' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ============================================================
              คอลัมน์ขวา - รายละเอียดรถ
              ============================================================ */}
          <div>
            {/* Badge - ประเภทรถ */}
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {carType}
            </span>

            {/* ชื่อรถ */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-4 mb-4">{name}</h1>

            {/* รายละเอียด */}
            <p className="text-slate-600 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">{description}</p>

            {/* ============================================================
                สิ่งที่รวมในแพ็คเกจ
                ============================================================ */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
                {t('car.includes') || 'รวมในแพ็คเกจ'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {includes?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-600">
                    <Check size={18} className="text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================
                ข้อมูลเพิ่มเติม - จำนวนผู้โดยสารสูงสุด
                ============================================================ */}
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-600 text-sm sm:text-base">
                <Users size={18} />
                <span>
                  {t('car.maxSeats', { count: car.max_passengers }) || `สูงสุด ${car.max_passengers} ที่นั่ง`}
                </span>
              </div>
            </div>

            {/* ============================================================
                ราคาและปุ่มจอง
                ============================================================ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 bg-slate-50 rounded-2xl p-4 sm:p-6">
              {/* ราคาต่อวัน */}
              <div>
                <p className="text-slate-500 text-xs sm:text-sm mb-1">{t('car.pricePerDay') || 'ราคาต่อวัน'}</p>
                <p className="text-2xl sm:text-3xl font-black text-indigo-600">
                  {formatCurrency(car.price_per_day)}
                  <span className="text-base sm:text-lg font-normal text-slate-500">{t('common.perDay')}</span>
                </p>
              </div>

              {/* ปุ่มจอง - Link ไปหน้า Booking */}
              <Link href={`/booking?type=CAR&id=${car.id}`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">{t('common.bookNow')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
