'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Check, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { Car } from '@/types'
import { formatCurrency } from '@/lib/utils'
import useLocalize from '@/hooks/useLocalize'
import Button from '@/components/ui/Button'

interface CarDetailClientProps {
  car: Car
}

export default function CarDetailClient({ car }: CarDetailClientProps) {
  const { t } = useTranslation()
  const { getField, getArrayField } = useLocalize()
  const [currentImage, setCurrentImage] = useState(0)

  const name = getField(car, 'name')
  const description = getField(car, 'description')
  const carType = getField(car, 'car_type')
  const includes = getArrayField(car, 'includes')

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % car.images.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + car.images.length) % car.images.length)
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/cars"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{t('common.back')}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
              <Image
                src={car.images[currentImage] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'}
                alt={name}
                fill
                className="object-cover"
              />
              {car.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail */}
            {car.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {car.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all ${
                      idx === currentImage ? 'ring-2 ring-indigo-600' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {carType}
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-4 mb-4">{name}</h1>

            <p className="text-slate-600 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">{description}</p>

            {/* Includes */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">รวมในแพ็คเกจ</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {includes?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-600">
                    <Check size={18} className="text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-600 text-sm sm:text-base">
                <Users size={18} />
                <span>สูงสุด {car.max_passengers} ที่นั่ง</span>
              </div>
            </div>

            {/* Price & Book */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 bg-slate-50 rounded-2xl p-4 sm:p-6">
              <div>
                <p className="text-slate-500 text-xs sm:text-sm mb-1">ราคาต่อวัน</p>
                <p className="text-2xl sm:text-3xl font-black text-indigo-600">
                  {formatCurrency(car.price_per_day)}
                  <span className="text-base sm:text-lg font-normal text-slate-500">{t('common.perDay')}</span>
                </p>
              </div>
              <Link href={`/booking?type=CAR&id=${car.id}`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">{t('common.bookNow')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
