'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Booking } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'

function SuccessContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBooking() {
      if (!code) {
        setLoading(false)
        return
      }

      const res = await fetch(`/api/bookings/${code}`)
      if (res.ok) {
        const data = await res.json()
        setBooking(data)
      }
      setLoading(false)
    }

    fetchBooking()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

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

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center">
        <div className="animate-scale-up">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
          {t('success.title')}
        </h1>

        <p className="text-slate-500 text-lg mb-8">{t('success.message')}</p>

        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-left mb-8">
          <div className="text-center mb-6">
            <p className="text-sm text-slate-500 mb-2">{t('success.bookingCode')}</p>
            <p className="text-3xl font-black text-indigo-600">{booking.booking_code}</p>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex justify-between">
              <span className="text-slate-500">ประเภท</span>
              <span className="font-medium">
                {booking.booking_type === 'HOTEL' ? 'โรงแรม' : 'รถเช่า'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">วันเช็คอิน</span>
              <span className="font-medium">{formatDate(booking.check_in_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">วันเช็คเอาท์</span>
              <span className="font-medium">{formatDate(booking.check_out_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">จำนวนผู้เข้าพัก</span>
              <span className="font-medium">{booking.number_of_guests} คน</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-100">
              <span className="font-bold text-slate-900">ราคารวม</span>
              <span className="font-bold text-xl text-indigo-600">
                {formatCurrency(booking.total_price)}
              </span>
            </div>
          </div>
        </div>

        <Link href="/">
          <Button size="lg">{t('success.backToHome')}</Button>
        </Link>
      </div>
    </div>
  )
}

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
