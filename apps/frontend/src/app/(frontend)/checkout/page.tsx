/**
 * ============================================================
 * Checkout Page - หน้าชำระเงิน (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงสรุปการจอง
 *   - แสดง payment methods ที่เลือกได้
 *   - Redirect ไป Omise หรือแสดง QR Code เมื่อกด Pay Now
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
 *   - ปุ่ม "Pay Now" ที่จะ redirect ไป Omise หรือแสดง QR Code
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
import { useSearchParams, useRouter } from 'next/navigation'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Next.js Link component */
import Link from 'next/link'
import Image from 'next/image'

/** Lucide icons สำหรับ UI */
import { CreditCard, Loader2, ArrowLeft, Lock, Shield } from 'lucide-react'

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

  /** Hook สำหรับ navigation */
  const router = useRouter()

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

    setProcessing(true)
    setError('')

    try {
      // สร้าง Checkout Session
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          success_url: `${window.location.origin}/success?code=${booking.booking_code}`,
          cancel_url: `${window.location.origin}/checkout?booking_code=${booking.booking_code}`,
        }),
      })

      if (!checkoutRes.ok) {
        let errorMessage = t('checkout.paymentError') || 'ไม่สามารถสร้างการชำระเงินได้'
        try {
          const errorData = await checkoutRes.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // ถ้า parse JSON ไม่ได้ ใช้ default message
          if (checkoutRes.status === 404) {
            errorMessage = t('checkout.bookingNotFound') || 'ไม่พบข้อมูลการจอง'
          } else if (checkoutRes.status === 400) {
            errorMessage = t('checkout.invalidData') || 'ข้อมูลไม่ถูกต้อง'
          } else if (checkoutRes.status >= 500) {
            errorMessage = t('checkout.serverError') || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์'
          }
        }
        setError(errorMessage)
        setProcessing(false)
        return
      }

      // Handle Omise response
      let responseData
      try {
        responseData = await checkoutRes.json()
      } catch (err) {
        console.error('Error parsing checkout response:', err)
        setError(t('checkout.paymentError') || 'ไม่สามารถสร้างการชำระเงินได้')
        setProcessing(false)
        return
      }

      // Omise returns different responses based on payment method:
      // - authorize_uri: สำหรับ Internet Banking, TrueMoney (redirect)
      // - scannable_code: สำหรับ PromptPay (แสดง QR Code)
      // - status: สำหรับ Card payment (อาจต้อง redirect หรือแสดง success)
      if (responseData.authorize_uri) {
        // Redirect ไปหน้า authorize (Internet Banking, TrueMoney)
        window.location.href = responseData.authorize_uri
      } else if (responseData.scannable_code) {
        // แสดง QR Code สำหรับ PromptPay
        // TODO: Implement QR Code display modal
        alert('กรุณาสแกน QR Code เพื่อชำระเงิน\n' + responseData.scannable_code.image_url)
        // Redirect ไปหน้า success หลังจากสแกน QR Code
        window.location.href = `${window.location.origin}/success?code=${booking.booking_code}`
      } else if (responseData.status === 'successful') {
        // Card payment สำเร็จ
        window.location.href = `${window.location.origin}/success?code=${booking.booking_code}`
      } else {
        // รอ webhook หรือแสดงสถานะ pending
        setError(t('checkout.paymentError') || 'ไม่สามารถสร้างการชำระเงินได้')
        setProcessing(false)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      // ตรวจสอบว่าเป็น network error หรือไม่
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(t('checkout.networkError') || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต')
      } else if (err instanceof Error) {
        setError(err.message || t('checkout.error') || 'เกิดข้อผิดพลาด')
      } else {
        setError(t('checkout.error') || 'เกิดข้อผิดพลาด')
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
  // Render
  // ----------------------------------------------------------
  /** ข้อมูลโรงแรม/รถ */
  const item = booking.hotel || booking.car
  const itemName = item ? getField(item, 'name') : ''

  /** รูปภาพ */
  const imageUrl = item?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'

  /** สกุลเงิน */
  const currency = (booking.currency || Currency.THB) as Currency

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {/* ============================================================
            ปุ่มกลับ
            ============================================================ */}
        <Link
          href={`/booking?type=${booking.booking_type}&id=${booking.hotel_id || booking.car_id}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{t('common.back')}</span>
        </Link>

        {/* Page Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 sm:mb-8">
          {t('checkout.title') || 'ชำระเงิน'}
        </h1>

        {/* ============================================================
            Main Content - 2 Columns Grid
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ============================================================
              คอลัมน์ซ้าย - Payment Methods
              ============================================================ */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Payment Methods Section */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-indigo-600" />
                {t('checkout.paymentMethods') || 'วิธีการชำระเงิน'}
              </h2>

              <div className="space-y-3 mb-6">
                {/* Credit Card */}
                <div className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 transition-colors">
                  <CreditCard size={24} className="text-indigo-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{t('checkout.creditCard') || 'บัตรเครดิต/เดบิต'}</p>
                    <p className="text-sm text-slate-500">{t('checkout.creditCardDesc') || 'Visa, Mastercard, Amex'}</p>
                  </div>
                </div>

                {/* PayPal */}
                <div className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 transition-colors">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PP</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">PayPal</p>
                    <p className="text-sm text-slate-500">{t('checkout.paypalDesc') || 'ชำระเงินผ่าน PayPal'}</p>
                  </div>
                </div>

                {/* PromptPay */}
                <div className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 transition-colors">
                  <Shield size={24} className="text-green-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">PromptPay</p>
                    <p className="text-sm text-slate-500">{t('checkout.promptpayDesc') || 'ชำระเงินผ่าน PromptPay'}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-500 text-center">
                {t('checkout.redirectMessage') || 'คุณจะถูกนำไปยังหน้า Omise เพื่อชำระเงิน'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Pay Now Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handlePayNow}
              loading={processing}
              disabled={processing}
            >
              {t('checkout.payNow') || 'ชำระเงินตอนนี้'}
            </Button>
          </div>

          {/* ============================================================
              คอลัมน์ขวา - Booking Summary
              ============================================================ */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                {t('booking.summary') || 'สรุปการจอง'}
              </h2>

              {/* รูปภาพ */}
              <div className="relative h-40 rounded-xl overflow-hidden mb-4">
                <Image
                  src={imageUrl}
                  alt={itemName}
                  fill
                  className="object-cover"
                />
              </div>

              {/* ชื่อ */}
              <h3 className="font-bold text-slate-900 mb-4 break-words">{itemName}</h3>

              {/* รายละเอียดการจอง */}
              <div className="space-y-3 text-sm border-t border-slate-100 pt-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('booking.checkIn') || 'วันเช็คอิน'}</span>
                  <span className="font-medium">{formatDate(booking.check_in_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('booking.checkOut') || 'วันเช็คเอาท์'}</span>
                  <span className="font-medium">{formatDate(booking.check_out_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {booking.booking_type === 'HOTEL'
                      ? t('booking.guests') || 'จำนวนผู้เข้าพัก'
                      : t('common.passengers') || 'ผู้โดยสาร'}
                  </span>
                  <span className="font-medium">{booking.number_of_guests} {t('common.persons') || 'ท่าน'}</span>
                </div>
              </div>

              {/* ราคารวม */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-900">{t('booking.totalPrice') || 'ราคารวม'}</span>
                <span className="font-bold text-xl text-indigo-600">
                  {formatCurrencyWithType(booking.total_price, currency)}
                </span>
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
