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
import { ArrowRight, MapPin, Users, Search, Calendar, Minus, Plus } from 'lucide-react'

/** Type definitions */
import { Hotel, Car } from '@chiangrai/shared/types'

/** UI Components */
import DateRangePicker from '@/components/ui/DateRangePicker'
import CustomSelect from '@/components/ui/CustomSelect'
import RecentlyViewed from '@/components/shared/RecentlyViewed'
import TrustSignals from '@/components/shared/TrustSignals'
import Reveal from '@/components/shared/Reveal'
import HowItWorks from '@/components/shared/HowItWorks'
import HotelCard from '@/components/cards/HotelCard'
import CarCard from '@/components/cards/CarCard'

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
            ----------------------------------------------------------
            Northern-Thailand-flavored shot: a winding mountain
            road with rice terraces, evokes the actual product
            (drive your own trip) rather than a generic beach. */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=2400&q=80"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
        </div>

        {/* ----------------------------------------------------------
            Hero Content — left-aligned editorial layout instead
            of centered "landing page template"
            ---------------------------------------------------------- */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 w-full">
          {/* Title — sans for line 1, italic serif for line 2.
              The serif italic on line 2 is the single biggest
              "this was designed by a human" signal on the page.
              Falls back to system Thai serif for Thai locales. */}
          {/* Hero stack uses a 80ms stagger so the eye reads the
              hierarchy (title → rule → subtitle → CTA → trust → search)
              instead of all six elements popping in at once. */}
          <h1
            className="text-5xl md:text-6xl text-white leading-[1.05] mb-5 animate-slide-up max-w-3xl tracking-tight"
            style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}
          >
            <span className="font-bold">{t('home.hero.titleLine1')}</span>
            <br />
            <span className="font-display font-light italic text-white/85">
              {t('home.hero.titleHighlight')}
            </span>
          </h1>

          {/* Thin accent rule — small typographic signature */}
          <div
            className="h-px w-16 bg-white/40 mb-6 animate-slide-up"
            style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}
          />

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-white/80 max-w-xl mb-10 animate-slide-up font-light leading-relaxed"
            style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}
          >
            {t('home.hero.subtitle')}
          </p>

          {/* Single CTA — stay simple */}
          <div
            className="flex flex-col sm:flex-row gap-3 animate-slide-up mb-6"
            style={{ animationDelay: '240ms', animationFillMode: 'backwards' }}
          >
            <Link
              href="/hotels"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-white text-slate-900 rounded-full font-semibold hover:bg-slate-100 hover:scale-[1.02] active:scale-95 transition-transform"
            >
              {t('navbar.bookPackage')}
            </Link>
            <Link
              href="/cars"
              className="inline-flex items-center justify-center px-7 py-3.5 text-white border border-white/30 rounded-full font-semibold hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-transform"
            >
              {t('navbar.cars')}
            </Link>
          </div>

          {/* Trust pills row — quick reassurance under the CTA. Uses
              the same TrustSignals component as the detail/checkout
              pages so the messaging stays consistent. */}
          <div
            className="animate-slide-up mb-10"
            style={{ animationDelay: '320ms', animationFillMode: 'backwards' }}
          >
            <TrustSignals variant="compact" />
          </div>

          {/* ----------------------------------------------------------
              Search Box
              ---------------------------------------------------------- */}
          <div
            className="mt-8 sm:mt-14 max-w-5xl mx-auto animate-slide-up px-4 overflow-visible relative z-20"
            style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-visible border border-white/50">
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto_auto] gap-0 overflow-visible items-stretch">
                {/* ============================================================
                    Destination Field - เลือกจังหวัด
                    ============================================================ */}
                <div className="flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors overflow-visible relative z-30 lg:border-r border-b lg:border-b-0 border-slate-200 cursor-pointer group rounded-t-2xl lg:rounded-tr-none lg:rounded-bl-2xl">
                  <MapPin className="text-slate-900 flex-shrink-0 group-hover:scale-110 transition-transform" size={22} />
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
                  <Calendar className="text-slate-900 flex-shrink-0 group-hover:scale-110 transition-transform" size={22} />
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
                  <Users className="text-slate-900 flex-shrink-0 group-hover:scale-110 transition-transform" size={22} />
                  <div className="flex-1 lg:min-w-[120px]">
                    <label className="block text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1 whitespace-nowrap">
                      {t('home.search.guests')}
                    </label>
                    <div className="flex items-center gap-3">
                      {/* ปุ่มลด */}
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-all active:scale-90 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                        disabled={guests <= 1}
                        aria-label={lang === 'th' ? 'ลดจำนวนผู้เข้าพัก' : 'Decrease guests'}
                      >
                        <Minus size={16} />
                      </button>
                      {/* จำนวน */}
                      <span className="text-lg text-slate-900 font-bold min-w-[32px] text-center" aria-live="polite">
                        {guests}
                      </span>
                      {/* ปุ่มเพิ่ม */}
                      <button
                        onClick={() => setGuests(guests + 1)}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-all active:scale-90 flex items-center justify-center font-bold"
                        aria-label={lang === 'th' ? 'เพิ่มจำนวนผู้เข้าพัก' : 'Increase guests'}
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
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-4 m-2 bg-slate-900 text-white rounded-xl font-bold text-sm sm:text-base hover:bg-slate-800 transition-all active:scale-95 shadow-md hover:shadow-lg min-h-[60px] sm:min-h-[70px]"
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
          <Reveal>
            <div className="flex items-center justify-between mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-medium text-slate-900 tracking-tight">
                {t('home.weeklyDeals.title')}
              </h2>
              {/* Link ดูทั้งหมด (Desktop) */}
              <Link
                href="/hotels"
                className="hidden sm:flex items-center gap-2 text-slate-900 font-semibold hover:gap-3 transition-all"
              >
                {t('home.weeklyDeals.viewAll')}
                <ArrowRight size={18} />
              </Link>
            </div>
          </Reveal>

          {/* Hotels Grid — uses the shared HotelCard component
              so the home page stays in lockstep with the listing
              page. Editing card design once propagates everywhere. */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>

          {/* Link ดูทั้งหมด (Mobile) */}
          <div className="sm:hidden mt-8 text-center">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 text-slate-900 font-bold"
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
            <Reveal>
              <div className="flex items-center justify-between mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-medium text-slate-900 tracking-tight">
                  {t('navbar.cars')}
                </h2>
                {/* Link ดูทั้งหมด (Desktop) */}
                <Link
                  href="/cars"
                  className="hidden sm:flex items-center gap-2 text-slate-900 font-semibold hover:gap-3 transition-all"
                >
                  {t('home.weeklyDeals.viewAll')}
                  <ArrowRight size={18} />
                </Link>
              </div>
            </Reveal>

            {/* Cars Grid — same shared CarCard as /cars listing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          How It Works — three-step explainer. Sits between the
          inventory previews and the trust grid so it answers
          "what happens after I click book?" before the user scrolls
          to the trust signals.
          ============================================================ */}
      <HowItWorks />

      {/* ============================================================
          Trust Signals — reassurance row above the fold of the
          last screenful, before the user scrolls into the footer.
          ============================================================ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <Reveal>
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-medium text-slate-900 tracking-tight mb-2">
                ทำไมต้องจองกับเรา
              </h2>
              <p className="text-sm text-slate-500 italic">Why book with us</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <TrustSignals variant="grid" />
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          Recently Viewed — populated from localStorage. Renders
          nothing on first visit, so this is invisible noise then.
          ============================================================ */}
      <section className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <RecentlyViewed />
        </div>
      </section>
    </div>
  )
}
