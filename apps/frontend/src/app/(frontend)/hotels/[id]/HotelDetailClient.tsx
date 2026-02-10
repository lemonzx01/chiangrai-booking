/**
 * ============================================================
 * Hotel Detail Client - หน้ารายละเอียดโรงแรม (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายละเอียดโรงแรมพร้อม Image Gallery
 *   - รองรับการเปลี่ยนภาษา (Thai/English)
 *   - มีปุ่มจองห้องพักที่ link ไปหน้า Booking
 *
 * Features:
 *   - Image Gallery พร้อม Thumbnail
 *   - Star Rating แสดงระดับโรงแรม
 *   - รายการสิ่งอำนวยความสะดวก
 *   - ข้อมูลจำนวนผู้เข้าพักสูงสุด
 *   - ราคาต่อคืนและปุ่มจอง
 *
 * การใช้งาน:
 *   <HotelDetailClient hotel={hotelData} />
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state */
import { useState, useEffect } from 'react'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Next.js components */
import Link from 'next/link'
import Image from 'next/image'

/** Lucide icons สำหรับ UI */
import { Star, MapPin, Users, Check, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

/** Type definition สำหรับข้อมูลโรงแรม */
import { Hotel, RoomType, Currency } from '@chiangrai/shared/types'

/** Utility function สำหรับ format ราคา */
import { formatCurrency } from '@chiangrai/shared/utils'
import { formatCurrency as formatCurrencyWithType } from '@chiangrai/shared/currency'

/** Custom hook สำหรับดึงข้อมูลตามภาษา */
import useLocalize from '@/hooks/useLocalize'

/** UI Components */
import Button from '@/components/ui/Button'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Props interface สำหรับ HotelDetailClient
 *
 * @property {Hotel} hotel - ข้อมูลโรงแรมที่จะแสดง
 */
interface HotelDetailClientProps {
  hotel: Hotel
}

// ============================================================
// Main Component
// ============================================================

/**
 * Client Component สำหรับแสดงรายละเอียดโรงแรม
 *
 * @description
 *   Component หลักสำหรับแสดงข้อมูลโรงแรมอย่างละเอียด
 *   มี Image Gallery ที่สลับรูปได้ และข้อมูลต่างๆ ของโรงแรม
 *
 *   โครงสร้าง UI:
 *   - ปุ่มกลับไปหน้ารายการ
 *   - Image Gallery (ซ้าย) + รายละเอียด (ขวา)
 *   - ชื่อ, ที่ตั้ง, Star Rating, Room Type
 *   - รายละเอียด และสิ่งอำนวยความสะดวก
 *   - ราคาและปุ่มจอง
 *
 * @param {HotelDetailClientProps} props - Props ที่มีข้อมูลโรงแรม
 * @returns {JSX.Element} Hotel detail UI
 *
 * @example
 *   <HotelDetailClient hotel={hotelData} />
 */
export default function HotelDetailClient({ hotel }: HotelDetailClientProps) {
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
  const images = hotel.images || []

  /** State สำหรับประเภทห้อง */
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true)

  // ----------------------------------------------------------
  // ดึงข้อมูลตามภาษาปัจจุบัน
  // ----------------------------------------------------------
  /** ชื่อโรงแรมตามภาษา */
  const name = getField(hotel, 'name')

  /** รายละเอียดโรงแรมตามภาษา */
  const description = getField(hotel, 'description')

  /** ประเภทห้องพักตามภาษา */
  const roomType = getField(hotel, 'room_type')

  /** รายการสิ่งอำนวยความสะดวกตามภาษา */
  const amenities = getArrayField(hotel, 'amenities')

  // ----------------------------------------------------------
  // Effects - ดึงข้อมูลประเภทห้อง
  // ----------------------------------------------------------
  useEffect(() => {
    async function fetchRoomTypes() {
      try {
        const res = await fetch(`/api/room-types?hotel_id=${hotel.id}`)
        if (res.ok) {
          const data = await res.json()
          setRoomTypes(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch room types:', error)
      } finally {
        setLoadingRoomTypes(false)
      }
    }
    fetchRoomTypes()
  }, [hotel.id])

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
            ปุ่มกลับไปหน้ารายการโรงแรม
            ============================================================ */}
        <Link
          href="/hotels"
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
                src={images[currentImage] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
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
              คอลัมน์ขวา - รายละเอียดโรงแรม
              ============================================================ */}
          <div>
            {/* Badge Section - Star Rating และ Room Type */}
            <div className="flex items-center gap-3 mb-4">
              {/* Star Rating Badge */}
              <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-slate-900">{hotel.star_rating}</span>
              </div>

              {/* Room Type Badge */}
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                {roomType}
              </span>
            </div>

            {/* ชื่อโรงแรม */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-4">{name}</h1>

            {/* ที่ตั้ง */}
            <div className="flex items-center gap-2 text-slate-500 mb-4 sm:mb-6 text-sm sm:text-base">
              <MapPin size={18} />
              <span>{getField(hotel, 'location')}</span>
            </div>

            {/* รายละเอียด */}
            <p className="text-slate-600 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">{description}</p>

            {/* ============================================================
                สิ่งอำนวยความสะดวก
                ============================================================ */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
                {t('hotel.amenities') || 'สิ่งอำนวยความสะดวก'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {amenities?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-600">
                    <Check size={18} className="text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================
                ข้อมูลเพิ่มเติม - จำนวนผู้เข้าพักสูงสุด
                ============================================================ */}
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-600 text-sm sm:text-base">
                <Users size={18} />
                <span>
                  {t('hotel.maxGuests', { count: hotel.max_guests }) || `สูงสุด ${hotel.max_guests} คน`}
                </span>
              </div>
            </div>

            {/* ============================================================
                ประเภทห้อง
                ============================================================ */}
            {!loadingRoomTypes && roomTypes.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
                  ประเภทห้อง
                </h3>
                <div className="space-y-3">
                  {roomTypes.map((roomType) => (
                    <div
                      key={roomType.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 mb-1">
                            {roomType.name_th}
                          </h4>
                          <p className="text-sm text-slate-500 mb-2">{roomType.name_en}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>สูงสุด {roomType.max_guests} คน</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-indigo-600">
                            {formatCurrencyWithType(roomType.price_per_night, Currency.THB)}
                          </p>
                          <p className="text-xs text-slate-500">/ คืน</p>
                        </div>
                      </div>
                      <Link
                        href={`/booking?type=HOTEL&id=${hotel.id}&room_type_id=${roomType.id}`}
                        className="mt-3 block"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          จองประเภทนี้
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================
                ราคาและปุ่มจอง (แสดงเมื่อไม่มีประเภทห้อง)
                ============================================================ */}
            {(!loadingRoomTypes && roomTypes.length === 0) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 bg-slate-50 rounded-2xl p-4 sm:p-6">
                {/* ราคาต่อคืน */}
                <div>
                  <p className="text-slate-500 text-xs sm:text-sm mb-1">{t('hotel.pricePerNight') || 'ราคาต่อคืน'}</p>
                  <p className="text-2xl sm:text-3xl font-black text-indigo-600">
                    {formatCurrency(hotel.price_per_night)}
                    <span className="text-base sm:text-lg font-normal text-slate-500">{t('common.perNight')}</span>
                  </p>
                </div>

                {/* ปุ่มจอง - Link ไปหน้า Booking */}
                <Link href={`/booking?type=HOTEL&id=${hotel.id}`} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">{t('common.bookNow')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
