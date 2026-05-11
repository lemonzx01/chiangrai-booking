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
import { useEffect, useState } from 'react'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Next.js components */
import Link from 'next/link'

/** Lucide icons สำหรับ UI */
import { Star, MapPin, Users, Check, ArrowLeft } from 'lucide-react'

/** Type definition สำหรับข้อมูลโรงแรม */
import { Hotel, RoomType, Currency } from '@chiangrai/shared/types'

/** Utility function สำหรับ format ราคา */
import { formatCurrency } from '@chiangrai/shared/utils'
import { formatCurrency as formatCurrencyWithType } from '@chiangrai/shared/currency'
import LoyaltyPointsPreview from '@/components/shared/LoyaltyPointsPreview'

/** Custom hook สำหรับดึงข้อมูลตามภาษา */
import useLocalize from '@/hooks/useLocalize'

/** UI Components */
import Button from '@/components/ui/Button'
import ReviewsSection from '@/components/shared/ReviewsSection'
import ImageGallery from '@/components/shared/ImageGallery'
import StickyBookBar from '@/components/shared/StickyBookBar'
import TrustSignals from '@/components/shared/TrustSignals'
import RecentlyViewed from '@/components/shared/RecentlyViewed'
import Reveal from '@/components/shared/Reveal'
import WishlistButton from '@/components/shared/WishlistButton'

/** Track viewing in localStorage */
import useRecentlyViewed from '@/hooks/useRecentlyViewed'

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

  /** Track this hotel in localStorage history (powers Recently Viewed). */
  const { track } = useRecentlyViewed()
  useEffect(() => {
    if (hotel?.id) track('hotel', hotel.id)
  }, [hotel?.id, track])

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

  /** Scroll to the booking section when StickyBookBar's CTA is tapped. */
  const scrollToBook = () => {
    const el = document.getElementById('book-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    else window.location.href = `/booking?type=HOTEL&id=${hotel.id}`
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
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{t('common.back')}</span>
        </Link>

        {/* ============================================================
            Main Content - 2 Columns Grid
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* ============================================================
              คอลัมน์ซ้าย - Image Gallery (Lightbox-enabled)
              ============================================================ */}
          <div>
            <ImageGallery
              images={images.length > 0 ? images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945']}
              alt={name}
              heroAspect="aspect-[4/3]"
            />
          </div>

          {/* ============================================================
              คอลัมน์ขวา - รายละเอียดโรงแรม
              ============================================================ */}
          <div>
            {/* Badge Section - Star Rating และ Room Type */}
            <div className="flex items-center gap-3 mb-4">
              {/* Star Rating Badge */}
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-900">{hotel.star_rating}</span>
              </div>

              {/* Room Type Badge */}
              <span className="text-sm font-medium text-slate-900 bg-slate-100 px-3 py-1.5 rounded-full">
                {roomType}
              </span>
            </div>

            {/* ชื่อโรงแรม */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-slate-900 tracking-tight mb-4">{name}</h1>

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
              <div id="book-section" className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
                  ประเภทห้อง
                </h3>
                <div className="space-y-3">
                  {roomTypes.map((roomType) => (
                    <div
                      key={roomType.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
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
                          <p className="text-xl font-semibold text-slate-900">
                            {formatCurrencyWithType(roomType.price_per_night, Currency.THB)}
                          </p>
                          <p className="text-xs text-slate-500 mb-1">/ คืน</p>
                          <LoyaltyPointsPreview
                            amountThb={Number(roomType.price_per_night) || 0}
                            size="sm"
                          />
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
              <div id="book-section" className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 bg-slate-50 rounded-2xl p-4 sm:p-6">
                {/* ราคาต่อคืน */}
                <div>
                  <p className="text-slate-500 text-xs sm:text-sm mb-1">{t('hotel.pricePerNight') || 'ราคาต่อคืน'}</p>
                  <p className="text-2xl sm:text-3xl font-display font-medium text-slate-900 tracking-tight">
                    {formatCurrency(hotel.price_per_night)}
                    <span className="text-base sm:text-lg font-normal text-slate-500">{t('common.perNight')}</span>
                  </p>
                  <div className="mt-2">
                    <LoyaltyPointsPreview
                      amountThb={Number(hotel.price_per_night) || 0}
                      size="md"
                    />
                  </div>
                </div>

                {/* ปุ่มจอง - Link ไปหน้า Booking */}
                <Link href={`/booking?type=HOTEL&id=${hotel.id}`} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">{t('common.bookNow')}</Button>
                </Link>
              </div>
            )}

            {/* Wishlist save button — sits in its own row above
                trust signals so it doesn't fight the primary CTA */}
            <div className="mt-4">
              <WishlistButton kind="hotel" id={hotel.id} variant="inline" showLabel />
            </div>

            {/* Trust signals reassurance under the booking CTA */}
            <div className="mt-5">
              <TrustSignals variant="compact" />
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ReviewsSection hotelId={hotel.id} />

        {/* Recently viewed — exclude this hotel so it doesn't show itself */}
        <Reveal>
          <RecentlyViewed excludeId={hotel.id} />
        </Reveal>
      </div>

      {/* Sticky bottom CTA: mobile always-on, desktop reveals on scroll */}
      <StickyBookBar
        price={hotel.price_per_night}
        unit="/ คืน"
        onBookClick={scrollToBook}
        ctaLabel={t('common.bookNow') || 'จองเลย'}
        hint={`${name} · ${getField(hotel, 'location')}`}
      />
    </div>
  )
}
