/**
 * ============================================================
 * Home Client - หน้าแรก (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงหน้าแรกของเว็บไซต์
 *   - แสดง Hero Section พร้อม Search Box
 *   - แสดงโรงแรมและรถเด่น
 *
 * การใช้งาน:
 *   <HomeClient hotels={hotelsArray} cars={carsArray} />
 *
 * โครงสร้าง:
 *   1. Hero Section - ภาพพื้นหลัง, หัวข้อ, ปุ่ม CTA
 *   2. Search Box - ค้นหาที่พัก (จังหวัด, วันที่, จำนวนคน)
 *   3. Featured Hotels - รายการโรงแรมเด่น
 *   4. Featured Cars - รายการรถเช่าเด่น
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks */
import { useState, useEffect } from 'react'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Next.js components */
import Link from 'next/link'
import Image from 'next/image'

/** Next.js hooks */
import { useRouter } from 'next/navigation'

/** Lucide icons สำหรับ UI */
import { ArrowRight, Star, MapPin, Users, Search, Calendar, Minus, Plus } from 'lucide-react'

/** Type definitions */
import { Hotel, Car } from '@chiangrai/shared/types'

/** Utility functions */
import { formatCurrency } from '@chiangrai/shared/utils'

/** Custom hook สำหรับดึงข้อมูลตามภาษา */
import useLocalize from '@/hooks/useLocalize'

/** UI Components */
import DateRangePicker from '@/components/ui/DateRangePicker'
import CustomSelect from '@/components/ui/CustomSelect'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Props interface สำหรับ HomeClient
 *
 * @property {Hotel[]} hotels - รายการโรงแรมเด่น
 * @property {Car[]} cars - รายการรถเช่าเด่น
 */
interface HomeClientProps {
  hotels: Hotel[]
  cars: Car[]
}

// ============================================================
// Main Component
// ============================================================

/**
 * Home Client Component - หน้าแรกของเว็บไซต์
 *
 * @description
 *   แสดงหน้าแรกพร้อม Hero, Search Box, และรายการ Featured
 *
 * @param {HomeClientProps} props - Props ที่มีข้อมูลโรงแรมและรถ
 * @returns {JSX.Element} Home page UI
 */
export default function HomeClient({ hotels, cars }: HomeClientProps) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t, i18n } = useTranslation()

  /** Hook สำหรับดึงข้อมูลตามภาษา */
  const { getField } = useLocalize()

  /** Hook สำหรับ navigation */
  const router = useRouter()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** จำนวนผู้เข้าพัก (default: 2) */
  const [guests, setGuests] = useState(2)

  /** จังหวัดที่เลือก */
  const [destination, setDestination] = useState('')

  /** วันเช็คอิน */
  const [startDate, setStartDate] = useState<Date | null>(null)

  /** วันเช็คเอาท์ */
  const [endDate, setEndDate] = useState<Date | null>(null)

  /** State สำหรับตรวจสอบว่า component mount แล้ว */
  const [mounted, setMounted] = useState(false)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
  /**
   * Effect: Set mounted state เมื่อ component mount
   * ใช้สำหรับป้องกัน hydration mismatch
   */
  useEffect(() => {
    setMounted(true)
  }, [])

  /** ภาษาปัจจุบัน (fallback เป็น 'th' ถ้ายังไม่ mount) */
  const lang = mounted ? i18n.language : 'th'

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการการค้นหา
   *
   * @description
   *   สร้าง query params และ redirect ไปหน้า hotels
   */
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (destination) params.set('destination', destination)
    if (startDate) params.set('date', startDate.toISOString())
    if (endDate) params.set('returnDate', endDate.toISOString())
    if (guests) params.set('guests', guests.toString())
    router.push(`/hotels?${params.toString()}`)
  }

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen">
      {/* ============================================================
          Hero Section
          ============================================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-visible pt-24 pb-40">
        {/* ----------------------------------------------------------
            Background Image + Overlay
            ---------------------------------------------------------- */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
        </div>

        {/* ----------------------------------------------------------
            Hero Content
            ---------------------------------------------------------- */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 text-center">
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 animate-slide-up">
            {t('home.hero.titleLine1')}
            <br />
            {t('home.hero.titleHighlight')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-12 animate-slide-up">
            {t('home.hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up mb-12">
            {/* ปุ่มจองแพ็คเกจ */}
            <Link
              href="/hotels"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all"
            >
              {t('navbar.bookPackage')}
            </Link>
            {/* ปุ่มเช่ารถ */}
            <Link
              href="/cars"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
            >
              {t('navbar.cars')}
            </Link>
          </div>

          {/* ----------------------------------------------------------
              Search Box
              ---------------------------------------------------------- */}
          <div className="mt-8 sm:mt-14 max-w-5xl mx-auto animate-slide-up px-4 overflow-visible relative z-20">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-visible border border-white/50">
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto_auto] gap-0 overflow-visible items-stretch">
                {/* ============================================================
                    Destination Field - เลือกจังหวัด
                    ============================================================ */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors overflow-visible relative z-30 lg:border-r border-b lg:border-b-0 border-slate-200 cursor-pointer group rounded-t-2xl lg:rounded-tr-none lg:rounded-bl-2xl">
                  <MapPin className="text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" size={22} />
                  <div className="overflow-visible flex-1 lg:min-w-[140px]">
                    <label className="block text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1 whitespace-nowrap">
                      {t('home.search.destination')}
                    </label>
                    <CustomSelect
                      value={destination}
                      onChange={setDestination}
                      placeholder={lang === 'th' ? 'เลือกจังหวัด' : 'Select province'}
                      options={[
                        { value: 'Chiang Rai', label: lang === 'th' ? 'เชียงราย' : 'Chiang Rai', code: 'CRI' },
                        { value: 'Chiang Mai', label: lang === 'th' ? 'เชียงใหม่' : 'Chiang Mai', code: 'CNX' },
                        { value: 'Phuket', label: lang === 'th' ? 'ภูเก็ต' : 'Phuket', code: 'HKT' },
                        { value: 'Bangkok', label: lang === 'th' ? 'กรุงเทพฯ' : 'Bangkok', code: 'BKK' },
                      ]}
                    />
                  </div>
                </div>

                {/* ============================================================
                    Date Range Field - เลือกวันที่
                    ============================================================ */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors lg:border-r border-b lg:border-b-0 border-slate-200 cursor-pointer group overflow-visible">
                  <Calendar className="text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" size={22} />
                  <div className="flex-1 lg:min-w-[180px] overflow-visible">
                    <label className="block text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1 whitespace-nowrap">
                      {lang === 'th' ? 'วันเข้าพัก - คืนห้อง' : 'Check-in - Check-out'}
                    </label>
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(dates) => {
                        setStartDate(dates[0])
                        setEndDate(dates[1])
                      }}
                      placeholder={lang === 'th' ? 'เลือกวันที่' : 'Select dates'}
                      minDate={new Date()}

                    />
                  </div>
                </div>

                {/* ============================================================
                    Guests Field - จำนวนผู้เข้าพัก
                    ============================================================ */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors lg:border-r border-b lg:border-b-0 border-slate-200 group">
                  <Users className="text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" size={22} />
                  <div className="flex-1 lg:min-w-[120px]">
                    <label className="block text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1 whitespace-nowrap">
                      {t('home.search.guests')}
                    </label>
                    <div className="flex items-center gap-3">
                      {/* ปุ่มลด */}
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                        disabled={guests <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      {/* จำนวน */}
                      <span className="text-lg text-slate-900 font-bold min-w-[32px] text-center">
                        {guests}
                      </span>
                      {/* ปุ่มเพิ่ม */}
                      <button
                        onClick={() => setGuests(guests + 1)}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90 flex items-center justify-center font-bold"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ============================================================
                    Search Button - ปุ่มค้นหา
                    ============================================================ */}
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-4 m-2 bg-indigo-600 text-white rounded-xl font-bold text-sm sm:text-base hover:bg-indigo-700 transition-all active:scale-95 shadow-lg hover:shadow-xl shadow-indigo-600/30 min-h-[60px] sm:min-h-[70px]"
                >
                  <Search size={20} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">{t('home.search.button')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          Featured Hotels Section - โรงแรมแนะนำ
          ============================================================ */}
      <section className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              {t('home.weeklyDeals.title')}
            </h2>
            {/* Link ดูทั้งหมด (Desktop) */}
            <Link
              href="/hotels"
              className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all"
            >
              {t('home.weeklyDeals.viewAll')}
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {hotels.map((hotel) => (
              <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
                <div className="group bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-300">
                  {/* รูปภาพ */}
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
                      alt={getField(hotel, 'name')}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Star Rating Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-sm">
                      <Star size={13} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold text-slate-900">{hotel.star_rating}</span>
                    </div>
                  </div>
                  {/* ข้อมูล */}
                  <div className="p-4">
                    {/* ที่ตั้ง */}
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2">
                      <MapPin size={12} />
                      <span>{getField(hotel, 'location')}</span>
                    </div>
                    {/* ชื่อ */}
                    <h3 className="text-base font-bold text-slate-900 mb-3 line-clamp-1">
                      {getField(hotel, 'name')}
                    </h3>
                    {/* จำนวนผู้เข้าพัก และ ราคา */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Users size={12} />
                        <span>{hotel.max_guests} {t('common.guests')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-indigo-600">
                          {formatCurrency(hotel.price_per_night)}
                        </span>
                        <span className="text-slate-500 text-xs">{t('common.perNight')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Link ดูทั้งหมด (Mobile) */}
          <div className="sm:hidden mt-8 text-center">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 text-indigo-600 font-bold"
            >
              {t('home.weeklyDeals.viewAll')}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          Featured Cars Section - รถเช่าแนะนำ
          ============================================================ */}
      {cars.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                {t('navbar.cars')}
              </h2>
              {/* Link ดูทั้งหมด (Desktop) */}
              <Link
                href="/cars"
                className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all"
              >
                {t('home.weeklyDeals.viewAll')}
                <ArrowRight size={18} />
              </Link>
            </div>

            {/* Cars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {cars.map((car) => (
                <Link key={car.id} href={`/cars/${car.id}`}>
                  <div className="group bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col md:flex-row">
                    {/* รูปภาพ */}
                    <div className="relative h-40 md:h-auto md:w-5/12 overflow-hidden">
                      <Image
                        src={car.images?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70'}
                        alt={getField(car, 'name')}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    {/* ข้อมูล */}
                    <div className="p-5 md:w-7/12 flex flex-col justify-center">
                      {/* ประเภทรถ */}
                      <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                        {getField(car, 'car_type')}
                      </span>
                      {/* ชื่อ */}
                      <h3 className="text-lg font-bold text-slate-900 mb-4">
                        {getField(car, 'name')}
                      </h3>
                      {/* จำนวนที่นั่ง และ ราคา */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Users size={12} />
                          <span>{car.max_passengers} {t('common.passengers')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-indigo-600">
                            {formatCurrency(car.price_per_day)}
                          </span>
                          <span className="text-slate-500 text-xs">{t('common.perDay')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
