'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Calendar, Users, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Hotel, Car, BookingType } from '@/types'
import { formatCurrency, calculateNights, calculateTotalPrice } from '@/lib/utils'
import useLocalize from '@/hooks/useLocalize'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

function BookingContent() {
  const { t } = useTranslation()
  const { getField } = useLocalize()
  const searchParams = useSearchParams()
  const router = useRouter()

  const type = searchParams.get('type') as BookingType
  const id = searchParams.get('id')

  const [item, setItem] = useState<Hotel | Car | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    async function fetchItem() {
      if (!type || !id) {
        setLoading(false)
        return
      }

      const endpoint = type === 'HOTEL' ? `/api/hotels/${id}` : `/api/cars/${id}`
      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        setItem(data)
      }
      setLoading(false)
    }

    fetchItem()
  }, [type, id])

  const nights = formData.check_in_date && formData.check_out_date
    ? calculateNights(formData.check_in_date, formData.check_out_date)
    : 0

  const pricePerUnit = item
    ? type === 'HOTEL'
      ? (item as Hotel).price_per_night
      : (item as Car).price_per_day
    : 0

  const totalPrice = calculateTotalPrice(pricePerUnit, nights)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Create booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type: type,
          hotel_id: type === 'HOTEL' ? id : null,
          car_id: type === 'CAR' ? id : null,
          ...formData,
          total_price: totalPrice,
        }),
      })

      if (!bookingRes.ok) {
        throw new Error('Failed to create booking')
      }

      const booking = await bookingRes.json()

      // Create checkout session
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          success_url: `${window.location.origin}/success?code=${booking.booking_code}`,
          cancel_url: `${window.location.origin}/booking?type=${type}&id=${id}&cancelled=true`,
        }),
      })

      if (!checkoutRes.ok) {
        // If checkout fails, still redirect to success (manual payment)
        router.push(`/success?code=${booking.booking_code}`)
        return
      }

      const { url } = await checkoutRes.json()
      if (url) {
        window.location.href = url
      } else {
        router.push(`/success?code=${booking.booking_code}`)
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

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

  const name = getField(item, 'name')

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {/* Back Button */}
        <Link
          href={type === 'HOTEL' ? `/hotels/${id}` : `/cars/${id}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{t('common.back')}</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 sm:mb-8">{t('booking.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Form */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Dates */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  วันที่เข้าพัก
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label={t('booking.checkIn')}
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
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

              {/* Guests */}
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
                  max={type === 'HOTEL' ? (item as Hotel).max_guests : (item as Car).max_passengers}
                  required
                />
              </div>

              {/* Customer Info */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('booking.customerInfo')}</h2>
                <div className="space-y-4">
                  <Input
                    label={t('booking.name')}
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="กรอกชื่อ-นามสกุล"
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
                  <Input
                    label={t('booking.line')}
                    value={formData.customer_line}
                    onChange={(e) => setFormData({ ...formData, customer_line: e.target.value })}
                    placeholder="@yourlineid"
                  />
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

              {error && (
                <p className="text-red-500 text-center">{error}</p>
              )}

              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                {t('booking.proceedToPayment')}
              </Button>
            </form>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{t('booking.summary')}</h2>

              <div className="relative h-40 rounded-xl overflow-hidden mb-4">
                <Image
                  src={item.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                  alt={name}
                  fill
                  className="object-cover"
                />
              </div>

              <h3 className="font-bold text-slate-900 mb-4 break-words">{name}</h3>

              <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
                {nights > 0 && (
                  <>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 text-xs sm:text-sm break-words">
                        {formatCurrency(pricePerUnit)} x {nights} {type === 'HOTEL' ? t('booking.nights') : t('booking.days')}
                      </span>
                      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-100">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">{t('booking.totalPrice')}</span>
                      <span className="font-bold text-lg sm:text-xl text-indigo-600 whitespace-nowrap">{formatCurrency(totalPrice)}</span>
                    </div>
                  </>
                )}
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
