/**
 * ============================================================
 * Success Page - หน้าจองสำเร็จ (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงผลลัพธ์การจองที่สำเร็จ
 *   - แสดงรายละเอียดการจอง
 *   - ให้ดาวน์โหลดใบเสร็จ (Invoice)
 *
 * Route:
 *   - /success?code=XXXXX - หน้าจองสำเร็จ
 *
 * Query Params:
 *   - code: รหัสการจอง (booking_code)
 *
 * Features:
 *   - แสดง Animation Success
 *   - รายละเอียดการจอง (ประเภท, วันที่, จำนวนคน, ราคา)
 *   - ปุ่มดาวน์โหลดใบเสร็จ
 *   - ปุ่มกลับหน้าแรก
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

/** Lucide icons สำหรับ UI */
import { CheckCircle, Loader2, Download } from 'lucide-react'

/** Type definition สำหรับ Booking */
import { Booking } from '@chiangrai/shared/types'

/** Utility functions */
import { formatCurrency, formatDate } from '@chiangrai/shared/utils'

/** UI Components */
import Button from '@/components/ui/Button'

// ============================================================
// Success Content Component
// ============================================================

/**
 * Success Content - เนื้อหาหลักของหน้า Success
 *
 * @description
 *   Component ที่แสดงรายละเอียดการจองที่สำเร็จ
 *   ดึงข้อมูลจาก API ตาม booking code
 *
 *   ขั้นตอนการทำงาน:
 *   1. ดึง booking code จาก URL params
 *   2. Fetch ข้อมูลการจองจาก API
 *   3. แสดงรายละเอียดการจอง
 *
 * @returns {JSX.Element} Success content UI
 */
function SuccessContent() {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t } = useTranslation()

  /** Hook สำหรับดึง URL query params */
  const searchParams = useSearchParams()

  /** รหัสการจองจาก URL */
  const code = searchParams.get('code')

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  /** State สำหรับข้อมูลการจอง */
  const [booking, setBooking] = useState<Booking | null>(null)

  /** State สำหรับสถานะการโหลด */
  const [loading, setLoading] = useState(true)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------
  /**
   * Effect: ดึงข้อมูลการจองเมื่อโหลดหน้า
   */
  useEffect(() => {
    async function fetchBooking() {
      // ถ้าไม่มี code ไม่ต้องดึงข้อมูล
      if (!code) {
        setLoading(false)
        return
      }

      // ดึงข้อมูลจาก API
      const res = await fetch(`/api/bookings/${code}`)
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
      }
      setLoading(false)
    }

    fetchBooking()
  }, [code])

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
  if (!booking) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
        <p className="text-slate-500 mb-4">ไม่พบข้อมูลการจอง</p>
        <Link href="/">
          <Button>กลับหน้าแรก</Button>
        </Link>
      </div>
    )
  }

  // ----------------------------------------------------------
  // Success State
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center">
        {/* ============================================================
            Success Icon - พร้อม Animation
            ============================================================ */}
        <div className="animate-scale-up">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        </div>

        {/* ============================================================
            Title และ Message
            ============================================================ */}
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
          {t('success.title')}
        </h1>

        <p className="text-slate-500 text-lg mb-8">{t('success.message')}</p>

        {/* ============================================================
            รายละเอียดการจอง
            ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-left mb-8">
          {/* รหัสการจอง */}
          <div className="text-center mb-6">
            <p className="text-sm text-slate-500 mb-2">{t('success.bookingCode')}</p>
            <p className="text-3xl font-black text-indigo-600">{booking.booking_code}</p>
          </div>

          {/* รายละเอียด */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            {/* ประเภทการจอง */}
            <div className="flex justify-between">
              <span className="text-slate-500">ประเภท</span>
              <span className="font-medium">
                {booking.booking_type === 'HOTEL' ? 'โรงแรม' : 'รถเช่า'}
              </span>
            </div>

            {/* วันเช็คอิน */}
            <div className="flex justify-between">
              <span className="text-slate-500">วันเช็คอิน</span>
              <span className="font-medium">{formatDate(booking.check_in_date)}</span>
            </div>

            {/* วันเช็คเอาท์ */}
            <div className="flex justify-between">
              <span className="text-slate-500">วันเช็คเอาท์</span>
              <span className="font-medium">{formatDate(booking.check_out_date)}</span>
            </div>

            {/* จำนวนผู้เข้าพัก */}
            <div className="flex justify-between">
              <span className="text-slate-500">จำนวนผู้เข้าพัก</span>
              <span className="font-medium">{booking.number_of_guests} คน</span>
            </div>

            {/* ราคารวม */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <span className="font-bold text-slate-900">ราคารวม</span>
              <span className="font-bold text-xl text-indigo-600">
                {formatCurrency(booking.total_price)}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================
            Action Buttons
            ============================================================ */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* ปุ่มดาวน์โหลดใบเสร็จ */}
          <a
            href={`/api/bookings/${booking.booking_code}/invoice`}
            download
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            {t('success.downloadInvoice') || 'ดาวน์โหลดใบเสร็จ'}
          </a>

          {/* ปุ่มกลับหน้าแรก */}
          <Link href="/">
            <Button size="lg">{t('success.backToHome')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================

/**
 * Success Page Component
 *
 * @description
 *   Wrapper component ที่ใช้ Suspense สำหรับ loading state
 *   เนื่องจากใช้ useSearchParams ต้องอยู่ใน Suspense
 *
 * @returns {JSX.Element} Success page พร้อม Suspense
 */
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
