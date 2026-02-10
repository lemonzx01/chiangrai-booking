/**
 * ============================================================
 * Checkout Page - หน้าชำระเงิน (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงสรุปการจอง
 *   - แสดง payment methods ที่เลือกได้
 *   - Redirect ไป Stripe Checkout เมื่อกด Pay Now
 *
 * Route:
 *   - /checkout?booking_id=xxx - หน้าชำระเงิน
 *   - /checkout?booking_code=xxx - หน้าชำระเงิน (alternative)
 *
 * Query Params:
 *   - booking_id: ID ของการจอง (UUID)
 *   - booking_code: รหัสการจอง (alternative)
 *
 * Features:
 *   - แสดงสรุปการจอง (ประเภท, วันที่, จำนวนคน, ราคา)
 *   - แสดง payment methods (Credit Card, PayPal, PromptPay)
 *   - ปุ่ม "Pay Now" ที่จะ redirect ไป Stripe Checkout
 *   - Loading state และ error handling
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks และ Suspense */
import { Suspense, useEffect, useState } from 'react'

/** Next.js hooks */
import { useSearchParams } from 'next/navigation'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Next.js Link component */
import Link from 'next/link'
import Image from 'next/image'

/** Lucide icons สำหรับ UI */
import { CreditCard, Loader2, ArrowLeft, Lock, Shield, Check, ShieldCheck, QrCode, CalendarDays, Users } from 'lucide-react'

/** Type definition สำหรับ Booking */
import { Booking, Currency } from '@chiangrai/shared/types'

/** Utility functions */
import { formatDate } from '@chiangrai/shared/utils'
import { formatCurrency as formatCurrencyWithType } from '@chiangrai/shared/currency'

/** Custom hook สำหรับดึงข้อมูลตามภาษา */
import useLocalize from '@/hooks/useLocalize'

/** UI Components */
import Button from '@/components/ui/Button'

// ============================================================
// Checkout Content Component
// ============================================================

/**
 * Checkout Content - เนื้อหาหลักของหน้า Checkout
 *
 * @description
 *   Component ที่แสดงสรุปการจองและ payment methods
 *   ดึงข้อมูลจาก API ตาม booking_id หรือ booking_code
 *
 * @returns {JSX.Element} Checkout content UI
 */
function CheckoutContent() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t } = useTranslation()

  /** Hook สำหรับดึงข้อมูลตามภาษา */
  const { getField } = useLocalize()

  /** Hook สำหรับดึง URL query params */
  const searchParams = useSearchParams()


  /** Booking Code จาก URL */
  const bookingCode = searchParams.get('booking_code') || searchParams.get('code')

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับข้อมูลการจอง */
  const [booking, setBooking] = useState<Booking | null>(null)

  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(true)

  /** State สำหรับสถานะการสร้าง checkout */
  const [processing, setProcessing] = useState(false)

  /** State สำหรับ error message */
  const [error, setError] = useState<string>('')

  /** State สำหรับ payment method ที่เลือก */
  const [selectedMethod, setSelectedMethod] = useState<string>('card')

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
  /**
   * Effect: ดึงข้อมูลการจองเมื่อโหลดหน้า
   */
  useEffect(() => {
    async function fetchBooking() {
      // ถ้าไม่มี booking_code ไม่ต้องดึงข้อมูล
      if (!bookingCode) {
        setLoading(false)
        setError(t('checkout.bookingNotFound') || 'ไม่พบข้อมูลการจอง')
        return
      }

      try {
        // ดึงข้อมูลจาก API โดยใช้ booking_code
        const res = await fetch(`/api/bookings/${bookingCode}`)
        if (res.ok) {
          const data = await res.json()
          setBooking(data)
        } else {
          setError(t('checkout.bookingNotFound') || 'ไม่พบข้อมูลการจอง')
        }
      } catch (err) {
        console.error('Error fetching booking:', err)
        // ตรวจสอบว่าเป็น network error หรือไม่
        if (err instanceof TypeError && err.message.includes('fetch')) {
          setError(t('checkout.networkError') || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต')
        } else {
          setError(t('checkout.error') || 'เกิดข้อผิดพลาด')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingCode, t])

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  /**
   * Handler: เมื่อกดปุ่ม Pay Now
   */
  const handlePayNow = async () => {
    if (!booking) return

    // ตรวจสอบว่ามี booking.id หรือไม่ (ถ้าไม่มีจะส่ง checkout ไม่ได้)
    if (!booking.id) {
      setError('ข้อมูลการจองไม่ครบ (ไม่มีรหัสอ้างอิง) กรุณากลับไปทำการจองใหม่')
      return
    }

    setProcessing(true)
    setError('')

    try {
      // สร้าง Checkout Session
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          payment_method: selectedMethod,
          success_url: `${window.location.origin}/success?code=${booking.booking_code}`,
          cancel_url: `${window.location.origin}/checkout?booking_code=${booking.booking_code}`,
        }),
      })

      if (!checkoutRes.ok) {
        // ดึง error message จาก API (backend ส่ง error เฉพาะเจาะจงกลับมา)
        let errorMessage = 'ไม่สามารถสร้างการชำระเงินได้'
        try {
          const errorData = await checkoutRes.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch {
          // ถ้า parse JSON ไม่ได้ ใช้ default ตาม status
          if (checkoutRes.status === 404) {
            errorMessage = 'ไม่พบข้อมูลการจองนี้ กรุณาทำการจองใหม่'
          } else if (checkoutRes.status === 400) {
            errorMessage = 'ข้อมูลการจองไม่ครบถ้วน กรุณากลับไปกรอกข้อมูลใหม่'
          } else if (checkoutRes.status === 429) {
            errorMessage = 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'
          } else if (checkoutRes.status >= 500) {
            errorMessage = 'เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ในอีกสักครู่'
          }
        }
        setError(errorMessage)
        setProcessing(false)
        return
      }

      // Redirect ไป Stripe Checkout
      let responseData
      try {
        responseData = await checkoutRes.json()
      } catch (err) {
        console.error('Error parsing checkout response:', err)
        setError('ได้รับข้อมูลจากเซิร์ฟเวอร์ไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง')
        setProcessing(false)
        return
      }

      const { url } = responseData
      if (url) {
        window.location.href = url
      } else {
        setError('ไม่สามารถสร้างลิงก์ชำระเงินได้ กรุณาลองใหม่อีกครั้ง')
        setProcessing(false)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่')
      } else {
        setError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง')
      }
      setProcessing(false)
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
  // Error State
  // ----------------------------------------------------------
  if (error && !booking) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
        <p className="text-slate-500 mb-4">{error}</p>
        <Link href="/">
          <Button>{t('common.back')}</Button>
        </Link>
      </div>
    )
  }

  // ----------------------------------------------------------
  // Not Found State
  // ----------------------------------------------------------
  if (!booking) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
        <p className="text-slate-500 mb-4">{t('checkout.bookingNotFound') || 'ไม่พบข้อมูลการจอง'}</p>
        <Link href="/">
          <Button>{t('common.back')}</Button>
        </Link>
      </div>
    )
  }

  // ----------------------------------------------------------
  // Booking Status Check - ตรวจสอบสถานะก่อนแสดง form ชำระเงิน
  // ----------------------------------------------------------
  if (booking.status === 'CANCELLED') {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">การจองนี้ถูกยกเลิกแล้ว</h2>
        <p className="text-slate-500 text-sm">ไม่สามารถชำระเงินสำหรับการจองที่ถูกยกเลิกได้</p>
        <Link href="/">
          <Button>{t('common.back') || 'กลับหน้าหลัก'}</Button>
        </Link>
      </div>
    )
  }

  if (booking.status === 'PAID' || booking.status === 'COMPLETED') {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">ชำระเงินเรียบร้อยแล้ว</h2>
        <p className="text-slate-500 text-sm">การจองนี้ได้รับการชำระเงินเรียบร้อยแล้ว</p>
        <p className="text-sm text-slate-400">รหัสการจอง: <span className="font-mono font-semibold">{booking.booking_code}</span></p>
        <Link href="/">
          <Button>{t('common.back') || 'กลับหน้าหลัก'}</Button>
        </Link>
      </div>
    )
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  /** ข้อมูลโรงแรม/รถ */
  const item = booking.hotel || booking.car
  const itemName = item ? getField(item, 'name') : ''

  /** รูปภาพ */
  const imageUrl = item?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'

  /** สกุลเงิน */
  const currency = (booking.currency || Currency.THB) as Currency

  /** จำนวนคืน */
  const nights = booking.check_in_date && booking.check_out_date
    ? Math.max(1, Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)))
    : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================================
            Header - ปุ่มกลับ + ชื่อหน้า
            ============================================================ */}
        <div className="mb-8">
          <Link
            href={`/booking?type=${booking.booking_type}&id=${booking.hotel_id || booking.car_id}`}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-4 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>{t('common.back')}</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {t('checkout.title') || 'ชำระเงิน'}
              </h1>
              <p className="text-sm text-slate-500">
                {t('checkout.bookingCode') || 'รหัสการจอง'}: <span className="font-mono font-semibold text-slate-700">{booking.booking_code}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================
            Main Content - 2 Columns Grid
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* ============================================================
              คอลัมน์ซ้าย - Payment Methods (3/5)
              ============================================================ */}
          <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
            {/* Payment Methods Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-indigo-600" />
                {t('checkout.paymentMethods') || 'เลือกวิธีการชำระเงิน'}
              </h2>

              <div className="space-y-3">
                {/* Credit Card */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all cursor-pointer text-left ${
                    selectedMethod === 'card'
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-sm shadow-indigo-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedMethod === 'card' ? 'bg-indigo-100' : 'bg-slate-100'
                  }`}>
                    <CreditCard size={20} className={selectedMethod === 'card' ? 'text-indigo-600' : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{t('checkout.creditCard') || 'บัตรเครดิต / เดบิต'}</p>
                    <p className="text-sm text-slate-500">Visa, Mastercard, American Express</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-slate-300'
                  }`}>
                    {selectedMethod === 'card' && <Check size={12} className="text-white" />}
                  </div>
                </button>

                {/* PayPal */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('paypal')}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all cursor-pointer text-left ${
                    selectedMethod === 'paypal'
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-sm shadow-indigo-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedMethod === 'paypal' ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    <span className={`text-sm font-extrabold ${selectedMethod === 'paypal' ? 'text-blue-600' : 'text-slate-500'}`}>P</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">PayPal</p>
                    <p className="text-sm text-slate-500">{t('checkout.paypalDesc') || 'ชำระเงินผ่านบัญชี PayPal'}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedMethod === 'paypal'
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-slate-300'
                  }`}>
                    {selectedMethod === 'paypal' && <Check size={12} className="text-white" />}
                  </div>
                </button>

                {/* PromptPay - แสดงเฉพาะสกุลเงิน THB */}
                {currency === Currency.THB && (
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('promptpay')}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all cursor-pointer text-left ${
                      selectedMethod === 'promptpay'
                        ? 'border-indigo-500 bg-indigo-50/60 shadow-sm shadow-indigo-100'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedMethod === 'promptpay' ? 'bg-green-100' : 'bg-slate-100'
                    }`}>
                      <QrCode size={20} className={selectedMethod === 'promptpay' ? 'text-green-600' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">PromptPay</p>
                      <p className="text-sm text-slate-500">{t('checkout.promptpayDesc') || 'สแกน QR Code ชำระผ่าน PromptPay'}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selectedMethod === 'promptpay'
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-slate-300'
                    }`}>
                      {selectedMethod === 'promptpay' && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Pay Now Button */}
            <button
              type="button"
              onClick={handlePayNow}
              disabled={processing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 text-base"
            >
              {processing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{t('checkout.processing') || 'กำลังดำเนินการ...'}</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>{t('checkout.payNow') || 'ชำระเงิน'} {formatCurrencyWithType(booking.total_price, currency)}</span>
                </>
              )}
            </button>

            {/* Security Badges */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={14} />
                <span>Secured by Stripe</span>
              </div>
            </div>

            {/* Redirect Message */}
            <p className="text-xs text-slate-400 text-center">
              {t('checkout.redirectMessage') || 'คุณจะถูกนำไปยังหน้าชำระเงินที่ปลอดภัยของ Stripe'}
            </p>
          </div>

          {/* ============================================================
              คอลัมน์ขวา - Booking Summary (2/5)
              ============================================================ */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden lg:sticky lg:top-24">
              {/* รูปภาพ - ใหญ่ขึ้น พร้อม overlay */}
              <div className="relative h-44 sm:h-48">
                <Image
                  src={imageUrl}
                  alt={itemName}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="inline-block bg-white/90 backdrop-blur-sm text-xs font-semibold text-indigo-700 px-2.5 py-1 rounded-full mb-1.5">
                    {booking.booking_type === 'HOTEL'
                      ? (t('common.hotel') || 'โรงแรม')
                      : (t('common.car') || 'รถเช่า')}
                  </span>
                  <h3 className="font-bold text-white text-lg leading-tight drop-shadow-sm break-words">{itemName}</h3>
                </div>
              </div>

              {/* รายละเอียดการจอง */}
              <div className="p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={16} className="text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-500 text-xs">{t('booking.checkIn') || 'เช็คอิน'}</p>
                      <p className="font-medium text-slate-800">{formatDate(booking.check_in_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarDays size={16} className="text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-500 text-xs">{t('booking.checkOut') || 'เช็คเอาท์'}</p>
                      <p className="font-medium text-slate-800">{formatDate(booking.check_out_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-slate-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-500 text-xs">
                        {booking.booking_type === 'HOTEL'
                          ? t('booking.guests') || 'ผู้เข้าพัก'
                          : t('common.passengers') || 'ผู้โดยสาร'}
                      </p>
                      <p className="font-medium text-slate-800">{booking.number_of_guests} {t('common.persons') || 'ท่าน'}</p>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      {formatCurrencyWithType(Math.round(booking.total_price / nights), currency)} x {nights} {t('common.nights') || 'คืน'}
                    </span>
                    <span className="text-slate-700">{formatCurrencyWithType(booking.total_price, currency)}</span>
                  </div>
                </div>

                {/* ราคารวม */}
                <div className="mt-4 pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                  <span className="font-bold text-slate-900">{t('booking.totalPrice') || 'ยอดชำระ'}</span>
                  <span className="font-black text-2xl text-indigo-600">
                    {formatCurrencyWithType(booking.total_price, currency)}
                  </span>
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
 * Checkout Page Component
 *
 * @description
 *   Wrapper component ที่ใช้ Suspense สำหรับ loading state
 *   เนื่องจากใช้ useSearchParams ต้องอยู่ใน Suspense
 *
 * @returns {JSX.Element} Checkout page พร้อม Suspense
 */
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
