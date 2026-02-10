/**
 * ============================================================
 * Booking Page - หน้าจองโรงแรม/รถ (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงฟอร์มการจอง
 *   - คำนวณราคาตามจำนวนคืน/วัน
 *   - สร้างการจองและ redirect ไป Stripe Checkout
 *
 * Route:
 *   - /booking?type=HOTEL&id=xxx - จองโรงแรม
 *   - /booking?type=CAR&id=xxx - จองรถ
 *
 * Query Params:
 *   - type: ประเภทการจอง (HOTEL หรือ CAR)
 *   - id: ID ของโรงแรมหรือรถ
 *
 * Features:
 *   - ฟอร์มเลือกวันที่ (Check-in / Check-out)
 *   - ฟอร์มจำนวนผู้เข้าพัก
 *   - ฟอร์มข้อมูลลูกค้า
 *   - สรุปราคาแบบ real-time
 *   - Integration กับ Stripe Checkout
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks */
import { Suspense, useState, useEffect, useRef } from 'react'

/** Next.js hooks */
import { useSearchParams, useRouter } from 'next/navigation'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Lucide icons สำหรับ UI */
import {
  Calendar, Users, ArrowLeft, Loader2, CheckCircle, XCircle,
  MapPin, Star, Clock, Shield, Building2, Car as CarIcon, Bed, Globe, User, ChevronDown, Check, Minus, Plus
} from 'lucide-react'

/** Next.js components */
import Link from 'next/link'
import Image from 'next/image'

/** Type definitions */
import { Hotel, Car, BookingType, RoomType, Currency } from '@chiangrai/shared/types'

/** Utility functions */
import { calculateNights, calculateTotalPrice } from '@chiangrai/shared/utils'
import { formatCurrency as formatCurrencyWithType, convertCurrency, CURRENCY_OPTIONS, getCurrencyInfo } from '@chiangrai/shared/currency'

/** Custom hook สำหรับดึงข้อมูลตามภาษา */
import useLocalize from '@/hooks/useLocalize'

/** Date utilities */
import { format } from 'date-fns'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import DateRangePicker from '@/components/ui/DateRangePicker'

// ============================================================
// Booking Content Component
// ============================================================

/**
 * Booking Content - เนื้อหาหลักของหน้า Booking
 *
 * @description
 *   Component ที่แสดงฟอร์มการจองและสรุปราคา
 *   แยกออกมาเพื่อใช้กับ Suspense
 *
 * @returns {JSX.Element} Booking form UI
 */
function BookingContent() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t } = useTranslation()

  /** Hook สำหรับดึงข้อมูลตามภาษา */
  const { getField } = useLocalize()

  /** Hook สำหรับดึง URL query params */
  const searchParams = useSearchParams()

  /** Hook สำหรับ navigation */
  const router = useRouter()

  /** ประเภทการจองจาก URL */
  const type = searchParams.get('type') as BookingType

  /** ID ของโรงแรม/รถจาก URL */
  const id = searchParams.get('id')

  /** Room Type ID จาก URL (ถ้ามี) */
  const roomTypeIdFromUrl = searchParams.get('room_type_id')

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับข้อมูลโรงแรม/รถ */
  const [item, setItem] = useState<Hotel | Car | null>(null)

  /** State สำหรับประเภทห้อง (เมื่อจองโรงแรม) */
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('')

  /** State สำหรับสกุลเงิน */
  const [currency, setCurrency] = useState<Currency>(Currency.THB)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const currencyRef = useRef<HTMLDivElement>(null)

  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(true)

  /** State สำหรับสถานะการส่งฟอร์ม */
  const [submitting, setSubmitting] = useState(false)

  /** State สำหรับข้อความ error */
  const [error, setError] = useState('')

  /** State สำหรับ availability check */
  const [availability, setAvailability] = useState<{ available: boolean; remaining?: number; total?: number } | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  /** State สำหรับข้อมูลฟอร์ม */
  const [formData, setFormData] = useState({
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    special_requests: '',
  })

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------

  /** ปิด currency dropdown เมื่อคลิกด้านนอก */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /**
   * Effect: ดึงข้อมูลโรงแรม/รถเมื่อโหลดหน้า
   */
  useEffect(() => {
    async function fetchItem() {
      if (!type || !id) {
        setLoading(false)
        return
      }

      // เลือก endpoint ตามประเภท
      const endpoint = type === 'HOTEL' ? `/api/hotels/${id}` : `/api/cars/${id}`
      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        // API อาจคืน { hotel, room_types } หรือ hotel object ตรงๆ
        const itemData = data.hotel || data
        setItem(itemData)

        // ถ้าเป็นโรงแรม ให้ดึงประเภทห้อง
        if (type === 'HOTEL') {
          const roomTypesRes = await fetch(`/api/room-types?hotel_id=${id}`)
          const roomTypesData = roomTypesRes.ok ? await roomTypesRes.json() : null
          // ใช้ room_types จาก API แยก หรือ fallback จาก hotel API
          const rtData = roomTypesData?.data?.length > 0
            ? roomTypesData.data
            : data.room_types || []
          setRoomTypes(rtData)
          // เลือกประเภทห้องจาก URL หรือประเภทแรกเป็นค่าเริ่มต้น (ถ้ามี)
          if (rtData.length > 0) {
            if (roomTypeIdFromUrl && rtData.find((rt: RoomType) => rt.id === roomTypeIdFromUrl)) {
              setSelectedRoomTypeId(roomTypeIdFromUrl)
            } else {
              setSelectedRoomTypeId(rtData[0].id)
            }
          }
        }
      }
      setLoading(false)
    }

    fetchItem()
  }, [type, id, roomTypeIdFromUrl])

  /**
   * Effect: เช็คห้องว่าง/รถว่างเมื่อเปลี่ยนวันที่หรือประเภทห้อง
   */
  useEffect(() => {
    async function checkAvailability() {
      if (!formData.check_in_date || !formData.check_out_date || !id) {
        setAvailability(null)
        return
      }

      // สร้าง query params
      const params = new URLSearchParams({
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
      })

      if (type === 'HOTEL' && selectedRoomTypeId) {
        params.set('room_type_id', selectedRoomTypeId)
      } else if (type === 'CAR') {
        params.set('car_id', id)
      } else {
        setAvailability(null)
        return
      }

      setCheckingAvailability(true)
      try {
        const res = await fetch(`/api/availability?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setAvailability(data)
        }
      } catch {
        setAvailability(null)
      } finally {
        setCheckingAvailability(false)
      }
    }

    checkAvailability()
  }, [formData.check_in_date, formData.check_out_date, selectedRoomTypeId, id, type])

  // ----------------------------------------------------------
  // Computed Values
  // ----------------------------------------------------------
  /** แปลง string dates เป็น Date objects สำหรับ DateRangePicker */
  const checkInDate = formData.check_in_date ? new Date(formData.check_in_date + 'T00:00:00') : null
  const checkOutDate = formData.check_out_date ? new Date(formData.check_out_date + 'T00:00:00') : null

  /** จำนวนคืน/วัน */
  const nights = formData.check_in_date && formData.check_out_date
    ? calculateNights(formData.check_in_date, formData.check_out_date)
    : 0

  /** ราคาต่อหน่วย (คืน/วัน) - คำนวณจากประเภทห้องหรือราคาโรงแรม/รถ */
  const pricePerUnit = item
    ? type === 'HOTEL'
      ? (() => {
          // ถ้ามีประเภทห้องที่เลือก ให้ใช้ราคาจากประเภทห้อง
          if (selectedRoomTypeId) {
            const selectedRoomType = roomTypes.find(rt => rt.id === selectedRoomTypeId)
            if (selectedRoomType) {
              return selectedRoomType.price_per_night
            }
          }
          // ถ้าไม่มี ให้ใช้ราคาจากโรงแรม
          return (item as Hotel).price_per_night || (item as Hotel).base_price_per_night || 0
        })()
      : (item as Car).price_per_day || (item as Car).base_price_per_day || 0
    : 0

  /** ราคารวมในสกุลเงิน THB */
  const totalPriceTHB = calculateTotalPrice(pricePerUnit, nights)

  /** ราคารวมในสกุลเงินที่เลือก */
  const totalPrice = currency === Currency.THB
    ? totalPriceTHB
    : convertCurrency(totalPriceTHB, Currency.THB, currency)

  // ----------------------------------------------------------
  // Event Handlers
  // ----------------------------------------------------------
  /**
   * จัดการเมื่อเลือกช่วงวันที่จาก DateRangePicker
   */
  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setFormData({
      ...formData,
      check_in_date: start ? format(start, 'yyyy-MM-dd') : '',
      check_out_date: end ? format(end, 'yyyy-MM-dd') : '',
    })
  }

  /**
   * จัดการการ submit ฟอร์ม
   *
   * ขั้นตอน:
   * 1. สร้างการจองผ่าน /api/bookings
   * 2. สร้าง Checkout Session ผ่าน /api/checkout
   * 3. Redirect ไป Stripe Checkout หรือ Success page
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // ----------------------------------------------------------
      // 1. สร้างการจอง
      // ----------------------------------------------------------
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type: type,
          hotel_id: type === 'HOTEL' ? id : null,
          car_id: type === 'CAR' ? id : null,
          room_type_id: type === 'HOTEL' && selectedRoomTypeId && roomTypes.length > 0 ? selectedRoomTypeId : null,
          currency: currency,
          ...formData,
          total_price: totalPriceTHB, // ส่งราคาใน THB ไปยัง API
        }),
      })

      if (!bookingRes.ok) {
        const errData = await bookingRes.json().catch(() => ({}))
        throw new Error(errData.error || errData.details || 'Failed to create booking')
      }

      const booking = await bookingRes.json()

      // ----------------------------------------------------------
      // 2. Redirect ไปหน้า Checkout
      // ----------------------------------------------------------
      router.push(`/checkout?booking_code=${booking.booking_code}`)
    } catch (err: any) {
      setError(err?.message || t('booking.errorMessage'))
      setSubmitting(false)
    }
  }

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-400">{t('booking.loadingData')}</p>
      </div>
    )
  }

  // ----------------------------------------------------------
  // Not Found State
  // ----------------------------------------------------------
  if (!item) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-slate-400" />
          </div>
          <h2 className="font-bold text-slate-900 mb-2">{t('booking.notFound')}</h2>
          <p className="text-slate-500 text-sm mb-6">{t('booking.notFoundMessage')}</p>
          <Link href="/">
            <Button variant="primary">{t('booking.backToHome')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  /** ชื่อโรงแรม/รถตามภาษา */
  const name = getField(item, 'name')

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-b from-indigo-50/50 to-transparent">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        {/* Back Button */}
        <Link
          href={type === 'HOTEL' ? `/hotels/${id}` : `/cars/${id}`}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{t('common.back')}</span>
        </Link>

        {/* Title Area */}
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
            {type === 'HOTEL' ? <Building2 size={14} /> : <CarIcon size={14} />}
            {type === 'HOTEL' ? t('booking.hotelBooking') : t('booking.carRental')}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">{t('booking.title')}</h1>
        <p className="text-slate-500 text-sm mb-8">{t('booking.subtitle')}</p>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-0 mb-8 sm:mb-10">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-200">1</div>
            <span className="ml-2 text-sm font-semibold text-indigo-600 hidden sm:inline">{t('booking.stepBookingInfo')}</span>
          </div>
          <div className="w-12 sm:w-20 h-0.5 bg-slate-200 mx-2 sm:mx-3" />
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-sm font-bold">2</div>
            <span className="ml-2 text-sm font-medium text-slate-400 hidden sm:inline">{t('booking.stepPayment')}</span>
          </div>
          <div className="w-12 sm:w-20 h-0.5 bg-slate-200 mx-2 sm:mx-3" />
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-sm font-bold">3</div>
            <span className="ml-2 text-sm font-medium text-slate-400 hidden sm:inline">{t('booking.stepConfirm')}</span>
          </div>
        </div>

        {/* Main Content - 2 Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Section: วันที่เข้าพัก */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 animate-slide-up" style={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{t('booking.dateSection')}</h2>
                    <p className="text-xs text-slate-400">{t('booking.dateSectionDesc')}</p>
                  </div>
                </div>
                <DateRangePicker
                  startDate={checkInDate}
                  endDate={checkOutDate}
                  onChange={handleDateRangeChange}
                  minDate={new Date()}
                  placeholder={t('booking.selectDates')}
                >
                  <div className="border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-slate-200">
                      {/* Check-in display */}
                      <div className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">{t('booking.checkIn')}</p>
                        <p className={`text-sm font-bold ${checkInDate ? 'text-slate-900' : 'text-slate-400'}`}>
                          {checkInDate ? format(checkInDate, 'dd/MM/yyyy') : '-- / -- / ----'}
                        </p>
                      </div>
                      {/* Check-out display */}
                      <div className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">{t('booking.checkOut')}</p>
                        <p className={`text-sm font-bold ${checkOutDate ? 'text-slate-900' : 'text-slate-400'}`}>
                          {checkOutDate ? format(checkOutDate, 'dd/MM/yyyy') : '-- / -- / ----'}
                        </p>
                      </div>
                    </div>
                  </div>
                </DateRangePicker>
                {/* Hidden required inputs for form validation */}
                <input type="hidden" name="check_in_date" value={formData.check_in_date} required />
                <input type="hidden" name="check_out_date" value={formData.check_out_date} required />

                {/* Availability Indicator */}
                {formData.check_in_date && formData.check_out_date && (
                  <div className="mt-4">
                    {checkingAvailability ? (
                      <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 rounded-xl px-4 py-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('booking.checkingAvailability')}
                      </div>
                    ) : availability ? (
                      availability.available ? (
                        <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">
                            {type === 'HOTEL' && availability.remaining != null
                              ? t('booking.roomsRemaining', { remaining: availability.remaining, total: availability.total })
                              : t('booking.available')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                          <XCircle className="w-4 h-4" />
                          <span className="font-medium">
                            {type === 'HOTEL' ? t('booking.hotelUnavailable') : t('booking.carUnavailable')}
                          </span>
                        </div>
                      )
                    ) : null}
                  </div>
                )}
              </div>

              {/* Section: ประเภทห้อง (สำหรับโรงแรม) */}
              {type === 'HOTEL' && roomTypes.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0.05s' }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Bed size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{t('booking.roomType')}</h2>
                      <p className="text-xs text-slate-400">{t('booking.roomTypeDesc')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {roomTypes.map((roomType) => (
                      <label
                        key={roomType.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          selectedRoomTypeId === roomType.id
                            ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="room_type"
                          value={roomType.id}
                          checked={selectedRoomTypeId === roomType.id}
                          onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedRoomTypeId === roomType.id ? 'border-indigo-600' : 'border-slate-300'
                        }`}>
                          {selectedRoomTypeId === roomType.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">{roomType.name_th} / {roomType.name_en}</p>
                          {roomType.max_guests && (
                            <p className="text-xs text-slate-500 mt-0.5">{t('booking.maxGuests', { count: roomType.max_guests })}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-indigo-600 text-sm">
                            {formatCurrencyWithType(roomType.price_per_night, Currency.THB)}
                          </p>
                          <p className="text-xs text-slate-400">{t('booking.perNight')}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: สกุลเงิน */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 animate-slide-up relative z-10" style={{ opacity: 0, animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Globe size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{t('booking.currency')}</h2>
                    <p className="text-xs text-slate-400">{t('booking.currencyDesc')}</p>
                  </div>
                </div>
                <div className="relative z-20" ref={currencyRef}>
                  <button
                    type="button"
                    onClick={() => setCurrencyOpen(!currencyOpen)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border ${currencyOpen ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'} bg-white transition-all duration-200`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                      {getCurrencyInfo(currency).symbol}
                    </span>
                    <span className="flex-1 text-left text-slate-900 font-medium">{getCurrencyInfo(currency).label}</span>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${currencyOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {currencyOpen && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
                      {CURRENCY_OPTIONS.map((option) => {
                        const isSelected = currency === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => { setCurrency(option.value as Currency); setCurrencyOpen(false) }}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors duration-150 ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                          >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                              {option.symbol}
                            </span>
                            <span className={`flex-1 text-left text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                              {option.label}
                            </span>
                            {isSelected && <Check size={16} className="text-indigo-600 flex-shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Section: จำนวนผู้เข้าพัก */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0.15s' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Users size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{t('booking.guests')}</h2>
                    <p className="text-xs text-slate-400">
                      {t('booking.maxGuests', {
                        count: type === 'HOTEL'
                          ? (selectedRoomTypeId && roomTypes.length > 0
                              ? roomTypes.find(rt => rt.id === selectedRoomTypeId)?.max_guests ?? (item as Hotel).max_guests ?? '-'
                              : (item as Hotel).max_guests ?? '-')
                          : (item as Car).max_passengers ?? '-'
                      })}
                    </p>
                  </div>
                </div>
                {(() => {
                  const maxGuests = type === 'HOTEL'
                    ? selectedRoomTypeId && roomTypes.length > 0
                      ? roomTypes.find(rt => rt.id === selectedRoomTypeId)?.max_guests ?? (item as Hotel).max_guests ?? 10
                      : (item as Hotel).max_guests ?? 10
                    : (item as Car).max_passengers ?? 10
                  return (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, number_of_guests: Math.max(1, formData.number_of_guests - 1) })}
                        disabled={formData.number_of_guests <= 1}
                        className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="text-xl font-bold text-slate-900 min-w-[40px] text-center">
                        {formData.number_of_guests}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, number_of_guests: Math.min(maxGuests, formData.number_of_guests + 1) })}
                        disabled={formData.number_of_guests >= maxGuests}
                        className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  )
                })()}
              </div>

              {/* Section: ข้อมูลลูกค้า */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 animate-slide-up" style={{ opacity: 0, animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-sky-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{t('booking.customerInfo')}</h2>
                    <p className="text-xs text-slate-400">{t('booking.customerInfoDesc')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Input
                    label={t('booking.name')}
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder={t('booking.namePlaceholder')}
                    required
                  />
                  <Input
                    type="email"
                    label={t('booking.email')}
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    placeholder="example@email.com"
                    required
                  />
                  <Input
                    type="tel"
                    label={t('booking.phone')}
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="0812345678"
                    required
                  />
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                      {t('booking.specialRequests')}
                    </label>
                    <textarea
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      placeholder={t('booking.specialRequestsPlaceholder')}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:border-indigo-500 hover:border-slate-300 transition-all duration-200 bg-white text-sm sm:text-base text-slate-900 placeholder:text-slate-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 transition-shadow"
                  loading={submitting}
                  disabled={submitting || (availability !== null && !availability.available)}
                >
                  {availability !== null && !availability.available
                    ? (type === 'HOTEL' ? t('booking.roomFullCannotBook') : t('booking.carUnavailableCannotBook'))
                    : t('booking.proceedToPayment')}
                </Button>
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <Shield size={14} />
                  <span>{t('booking.securityNotice')}</span>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:sticky lg:top-24">
              {/* Image with Gradient Overlay */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
                  alt={name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-bold text-white text-lg leading-tight drop-shadow-sm break-words">{name}</h3>
                </div>
                {/* Type Badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {type === 'HOTEL' ? <Building2 size={12} /> : <CarIcon size={12} />}
                    {type === 'HOTEL' ? t('booking.hotelBooking') : t('booking.carRental')}
                  </span>
                </div>
                {/* Star Rating Badge (hotels) */}
                {type === 'HOTEL' && (item as Hotel).star_rating > 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      {(item as Hotel).star_rating}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5">
                {/* Location (hotels) */}
                {type === 'HOTEL' && ((item as Hotel).location_th || (item as Hotel).location_en) && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-4">
                    <MapPin size={12} className="flex-shrink-0" />
                    <span>{getField(item, 'location')}</span>
                  </div>
                )}

                {/* Booking Details */}
                <div className="space-y-3 text-sm">
                  {/* Selected Room Type */}
                  {type === 'HOTEL' && selectedRoomTypeId && roomTypes.length > 0 && (
                    <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                      <Bed size={14} className="text-indigo-600 flex-shrink-0" />
                      <span className="text-indigo-700 font-medium text-xs">
                        {roomTypes.find(rt => rt.id === selectedRoomTypeId)?.name_th || 'Standard'}
                      </span>
                    </div>
                  )}

                  {/* Dates Recap */}
                  {formData.check_in_date && formData.check_out_date && (
                    <div className="bg-slate-50 rounded-lg px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Calendar size={12} />
                          {t('booking.checkInLabel')}
                        </span>
                        <span className="font-medium text-slate-700">{formData.check_in_date}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Calendar size={12} />
                          {t('booking.checkOutLabel')}
                        </span>
                        <span className="font-medium text-slate-700">{formData.check_out_date}</span>
                      </div>
                      {nights > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Clock size={12} />
                            {t('booking.duration')}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {nights} {type === 'HOTEL' ? t('booking.nights') : t('booking.days')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Guests */}
                  {formData.number_of_guests > 0 && (
                    <div className="flex items-center justify-between text-xs px-3 py-2">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Users size={12} />
                        {type === 'HOTEL' ? t('booking.guestLabel') : t('booking.passengerLabel')}
                      </span>
                      <span className="font-medium text-slate-700">{formData.number_of_guests} {t('common.persons')}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-slate-100" />

                {/* Fare Summary */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('booking.fareBreakdown')}</h4>

                  {nights > 0 ? (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">
                          {type === 'HOTEL' ? t('booking.roomCharge') : t('booking.carCharge')}
                        </span>
                        <span className="text-slate-700">
                          {formatCurrencyWithType(
                            currency === Currency.THB ? pricePerUnit : convertCurrency(pricePerUnit, Currency.THB, currency),
                            currency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">
                          x {nights} {type === 'HOTEL' ? t('booking.nights') : t('booking.days')}
                        </span>
                        <span className="text-slate-700">
                          {formatCurrencyWithType(
                            currency === Currency.THB ? totalPriceTHB : convertCurrency(totalPriceTHB, Currency.THB, currency),
                            currency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{t('booking.serviceFee')}</span>
                        <span className="text-green-600 font-medium">{t('booking.free')}</span>
                      </div>

                      {/* Total */}
                      <div className="border-t border-slate-200 pt-3 mt-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{t('booking.totalPrice')}</span>
                          <span className="font-black text-xl text-indigo-600">
                            {formatCurrencyWithType(totalPrice, currency)}
                          </span>
                        </div>
                        {currency !== Currency.THB && (
                          <div className="text-right mt-1">
                            <span className="text-xs text-slate-400">
                              ({formatCurrencyWithType(totalPriceTHB, Currency.THB)})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar size={32} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">{t('booking.selectDateToSeePrice')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================

/**
 * Booking Page Component
 *
 * @description
 *   Wrapper component ที่ใช้ Suspense สำหรับ loading state
 *   เนื่องจากใช้ useSearchParams ต้องอยู่ใน Suspense
 *
 * @returns {JSX.Element} Booking page พร้อม Suspense
 */
export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  )
}
