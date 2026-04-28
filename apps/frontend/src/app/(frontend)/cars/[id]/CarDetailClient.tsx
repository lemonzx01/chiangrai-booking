/**
 * ============================================================
 * Car Detail Client - หน้ารายละเอียดรถเช่า (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายละเอียดรถพร้อม ImageGallery (lightbox-enabled)
 *   - StickyBookBar มือถือเสมอ + desktop เมื่อ scroll ลง
 *   - TrustSignals + RecentlyViewed
 *
 * ============================================================
 */

'use client'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Users, Check, ArrowLeft } from 'lucide-react'

import { Car } from '@chiangrai/shared/types'
import { formatCurrency } from '@chiangrai/shared/utils'

import useLocalize from '@/hooks/useLocalize'
import useRecentlyViewed from '@/hooks/useRecentlyViewed'

import Button from '@/components/ui/Button'
import ReviewsSection from '@/components/shared/ReviewsSection'
import ImageGallery from '@/components/shared/ImageGallery'
import StickyBookBar from '@/components/shared/StickyBookBar'
import TrustSignals from '@/components/shared/TrustSignals'
import RecentlyViewed from '@/components/shared/RecentlyViewed'
import Reveal from '@/components/shared/Reveal'
import WishlistButton from '@/components/shared/WishlistButton'

interface CarDetailClientProps {
  car: Car
}

export default function CarDetailClient({ car }: CarDetailClientProps) {
  const { t } = useTranslation()
  const { getField, getArrayField } = useLocalize()

  // Track this car in localStorage history (powers Recently Viewed).
  const { track } = useRecentlyViewed()
  useEffect(() => {
    if (car?.id) track('car', car.id)
  }, [car?.id, track])

  const images = car.images || []
  const name = getField(car, 'name')
  const description = getField(car, 'description')
  const carType = getField(car, 'car_type')
  const includes = getArrayField(car, 'includes')

  const scrollToBook = () => {
    const el = document.getElementById('book-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    else window.location.href = `/booking?type=CAR&id=${car.id}`
  }

  return (
    <div className="min-h-screen pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/cars"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{t('common.back')}</span>
        </Link>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Image gallery (lightbox-enabled) */}
          <div>
            <ImageGallery
              images={images.length > 0 ? images : ['https://images.unsplash.com/photo-1503376780353-7e6692767b70']}
              alt={name}
              heroAspect="aspect-[4/3]"
            />
          </div>

          {/* Detail column */}
          <div>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {carType}
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-4 mb-4">
              {name}
            </h1>

            <p className="text-slate-600 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">
              {description}
            </p>

            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">
                {t('car.includes') || 'รวมในแพ็คเกจ'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {includes?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-600">
                    <Check size={18} className="text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-600 text-sm sm:text-base">
                <Users size={18} />
                <span>
                  {t('car.maxSeats', { count: car.max_passengers }) ||
                    `สูงสุด ${car.max_passengers} ที่นั่ง`}
                </span>
              </div>
            </div>

            {/* Book section */}
            <div
              id="book-section"
              className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 bg-slate-50 rounded-2xl p-4 sm:p-6"
            >
              <div>
                <p className="text-slate-500 text-xs sm:text-sm mb-1">
                  {t('car.pricePerDay') || 'ราคาต่อวัน'}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-indigo-600">
                  {formatCurrency(car.price_per_day)}
                  <span className="text-base sm:text-lg font-normal text-slate-500">
                    {t('common.perDay')}
                  </span>
                </p>
              </div>

              <Link href={`/booking?type=CAR&id=${car.id}`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  {t('common.bookNow')}
                </Button>
              </Link>
            </div>

            <div className="mt-4">
              <WishlistButton kind="car" id={car.id} variant="inline" showLabel />
            </div>

            <div className="mt-5">
              <TrustSignals variant="compact" />
            </div>
          </div>
        </div>

        <ReviewsSection carId={car.id} />

        <Reveal>
          <RecentlyViewed excludeId={car.id} />
        </Reveal>
      </div>

      {/* Sticky book bar */}
      <StickyBookBar
        price={car.price_per_day}
        unit="/ วัน"
        onBookClick={scrollToBook}
        ctaLabel={t('common.bookNow') || 'จองเลย'}
        hint={`${name} · ${carType}`}
      />
    </div>
  )
}
