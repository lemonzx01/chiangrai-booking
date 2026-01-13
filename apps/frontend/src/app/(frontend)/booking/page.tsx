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
import { Suspense, useState, useEffect } from 'react'

/** Next.js hooks */
import { useSearchParams, useRouter } from 'next/navigation'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Lucide icons สำหรับ UI */
import { Calendar, Users, ArrowLeft, Loader2 } from 'lucide-react'

/** Next.js components */
import Link from 'next/link'
import Image from 'next/image'

/** Type definitions */
import { Hotel, Car, BookingType, RoomType, Currency } from '@chiangrai/shared/types'

/** Utility functions */
import { calculateNights, calculateTotalPrice } from '@chiangrai/shared/utils'
import { formatCurrency as formatCurrencyWithType, convertCurrency, CURRENCY_OPTIONS } from '@chiangrai/shared/currency'

/** Custom hook สำหรับดึงข้อมูลตามภาษา */
import useLocalize from '@/hooks/useLocalize'

/** UI Components */
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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

  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(true)

  /** State สำหรับสถานะการส่งฟอร์ม */
  const [submitting, setSubmitting] = useState(false)

  /** State สำหรับข้อความ error */
  const [error, setError] = useState('')

  /** State สำหรับข้อมูลฟอร์ม */
  const [formData, setFormData] = useState({
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_line: '',
    special_requests: '',
  })

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
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
        setItem(data)
        
        // ถ้าเป็นโรงแรม ให้ดึงประเภทห้อง
        if (type === 'HOTEL') {
          const roomTypesRes = await fetch(`/api/room-types?hotel_id=${id}`)
          if (roomTypesRes.ok) {
            const roomTypesData = await roomTypesRes.json()
            setRoomTypes(roomTypesData.data || [])
            // เลือกประเภทห้องจาก URL หรือประเภทแรกเป็นค่าเริ่มต้น (ถ้ามี)
            if (roomTypesData.data && roomTypesData.data.length > 0) {
              if (roomTypeIdFromUrl && roomTypesData.data.find((rt: RoomType) => rt.id === roomTypeIdFromUrl)) {
                setSelectedRoomTypeId(roomTypeIdFromUrl)
              } else {
                setSelectedRoomTypeId(roomTypesData.data[0].id)
              }
            }
          }
        }
      }
      setLoading(false)
    }

    fetchItem()
  }, [type, id, roomTypeIdFromUrl])

  // ----------------------------------------------------------
  // Computed Values
  // ----------------------------------------------------------
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
        throw new Error('Failed to create booking')
      }

      const booking = await bookingRes.json()

      // ----------------------------------------------------------
      // 2. Redirect ไปหน้า Checkout
      // ----------------------------------------------------------
      router.push(`/checkout?booking_code=${booking.booking_code}`)
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
      setSubmitting(false)
    }
  }

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // ----------------------------------------------------------
  // Not Found State
  // ----------------------------------------------------------
  if (!item) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
        <p className="text-slate-500 mb-4">ไม่พบข้อมูล</p>
        <Link href="/" className="text-indigo-600 font-medium">
          กลับหน้าแรก
        </Link>
      </div>
    )
  }

  /** ชื่อโรงแรม/รถตามภาษา */
  const name = getField(item, 'name')

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {/* ============================================================
            ปุ่มกลับ
            ============================================================ */}
        <Link
          href={type === 'HOTEL' ? `/hotels/${id}` : `/cars/${id}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{t('common.back')}</span>
        </Link>

        {/* Page Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 sm:mb-8">{t('booking.title')}</h1>

        {/* ============================================================
            Main Content - 2 Columns Grid
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ============================================================
              คอลัมน์ซ้าย - Booking Form
              ============================================================ */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* ----------------------------------------------------------
                  Section: วันที่เข้าพัก
                  ---------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  วันที่เข้าพัก
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* วันเช็คอิน */}
                  <Input
                    type="date"
                    label={t('booking.checkIn')}
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  {/* วันเช็คเอาท์ */}
                  <Input
                    type="date"
                    label={t('booking.checkOut')}
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    min={formData.check_in_date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {/* ----------------------------------------------------------
                  Section: ประเภทห้อง (สำหรับโรงแรม)
                  ---------------------------------------------------------- */}
              {type === 'HOTEL' && roomTypes.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">ประเภทห้อง</h2>
                  <select
                    value={selectedRoomTypeId}
                    onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                    required
                  >
                    {roomTypes.map((roomType) => (
                      <option key={roomType.id} value={roomType.id}>
                        {roomType.name_th} / {roomType.name_en} - {formatCurrencyWithType(roomType.price_per_night, Currency.THB)}/คืน
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ----------------------------------------------------------
                  Section: สกุลเงิน
                  ---------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">สกุลเงิน</h2>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ----------------------------------------------------------
                  Section: จำนวนผู้เข้าพัก
                  ---------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-indigo-600" />
                  {t('booking.guests')}
                </h2>
                <Input
                  type="number"
                  value={formData.number_of_guests}
                  onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={
                    type === 'HOTEL'
                      ? selectedRoomTypeId && roomTypes.length > 0
                        ? roomTypes.find(rt => rt.id === selectedRoomTypeId)?.max_guests || (item as Hotel).max_guests
                        : (item as Hotel).max_guests
                      : (item as Car).max_passengers
                  }
                  required
                />
              </div>

              {/* ----------------------------------------------------------
                  Section: ข้อมูลลูกค้า
                  ---------------------------------------------------------- */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('booking.customerInfo')}</h2>
                <div className="space-y-4">
                  {/* ชื่อ */}
                  <Input
                    label={t('booking.name')}
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="กรอกชื่อ-นามสกุล"
                    required
                  />
                  {/* อีเมล */}
                  <Input
                    type="email"
                    label={t('booking.email')}
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    placeholder="example@email.com"
                    required
                  />
                  {/* โทรศัพท์ */}
                  <Input
                    type="tel"
                    label={t('booking.phone')}
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="0812345678"
                    required
                  />
                  {/* LINE ID */}
                  <Input
                    label={t('booking.line')}
                    value={formData.customer_line}
                    onChange={(e) => setFormData({ ...formData, customer_line: e.target.value })}
                    placeholder="@yourlineid"
                  />
                  {/* ความต้องการพิเศษ */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('booking.specialRequests')}
                    </label>
                    <textarea
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      placeholder="ความต้องการพิเศษ (ถ้ามี)"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-center">{error}</p>
              )}

              {/* Submit Button */}
              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                {t('booking.proceedToPayment')}
              </Button>
            </form>
          </div>

          {/* ============================================================
              คอลัมน์ขวา - Booking Summary
              ============================================================ */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{t('booking.summary')}</h2>

              {/* รูปภาพ */}
              <div className="relative h-40 rounded-xl overflow-hidden mb-4">
                <Image
                  src={item.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                  alt={name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* ชื่อ */}
              <h3 className="font-bold text-slate-900 mb-4 break-words">{name}</h3>

              {/* สรุปราคา */}
              <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
                {nights > 0 && (
                  <>
                    {/* รายละเอียดราคา */}
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 text-xs sm:text-sm break-words">
                        {formatCurrencyWithType(
                          currency === Currency.THB ? pricePerUnit : convertCurrency(pricePerUnit, Currency.THB, currency),
                          currency
                        )} x {nights} {type === 'HOTEL' ? t('booking.nights') : t('booking.days')}
                      </span>
                      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrencyWithType(
                          currency === Currency.THB ? totalPriceTHB : convertCurrency(totalPriceTHB, Currency.THB, currency),
                          currency
                        )}
                      </span>
                    </div>
                    {/* ราคารวม */}
                    <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-100">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">{t('booking.totalPrice')}</span>
                      <span className="font-bold text-lg sm:text-xl text-indigo-600 whitespace-nowrap">
                        {formatCurrencyWithType(totalPrice, currency)}
                      </span>
                    </div>
                  </>
                )}
                {/* ข้อความเมื่อยังไม่ได้เลือกวันที่ */}
                {nights <= 0 && (
                  <p className="text-slate-500 text-center">เลือกวันที่เพื่อดูราคา</p>
                )}
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
