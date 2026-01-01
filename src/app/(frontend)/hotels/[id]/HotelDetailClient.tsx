'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Users, Check, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { Hotel } from '@/types'
import { formatCurrency } from '@/lib/utils'
import useLocalize from '@/hooks/useLocalize'
import Button from '@/components/ui/Button'

interface HotelDetailClientProps {
  hotel: Hotel
}

export default function HotelDetailClient({ hotel }: HotelDetailClientProps) {
  const { t } = useTranslation()
  const { getField, getArrayField } = useLocalize()
  const [currentImage, setCurrentImage] = useState(0)

  const name = getField(hotel, 'name')
  const description = getField(hotel, 'description')
  const roomType = getField(hotel, 'room_type')
  const amenities = getArrayField(hotel, 'amenities')

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % hotel.images.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + hotel.images.length) % hotel.images.length)
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Back Button */}
        <Link
          href="/hotels"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{t('common.back')}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
              <Image
                src={hotel.images[currentImage] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                alt={name}
                fill
                className="object-cover"
              />
              {hotel.images.length > 1 && (
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
            {hotel.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {hotel.images.map((img, idx) => (
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
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-slate-900">{hotel.star_rating}</span>
              </div>
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                {roomType}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{name}</h1>

            <div className="flex items-center gap-2 text-slate-500 mb-6">
              <MapPin size={18} />
              <span>{hotel.location}</span>
            </div>

            <p className="text-slate-600 leading-relaxed mb-8">{description}</p>

            {/* Amenities */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">สิ่งอำนวยความสะดวก</h3>
              <div className="grid grid-cols-2 gap-3">
                {amenities?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-600">
                    <Check size={18} className="text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={18} />
                <span>สูงสุด {hotel.max_guests} คน</span>
              </div>
            </div>

            {/* Price & Book */}
            <div className="flex items-end justify-between bg-slate-50 rounded-2xl p-6">
              <div>
                <p className="text-slate-500 text-sm mb-1">{t('home.weeklyDeals.packageStart')}</p>
                <p className="text-3xl font-black text-indigo-600">
                  {formatCurrency(hotel.price_per_night)}
                  <span className="text-lg font-normal text-slate-500">{t('common.perNight')}</span>
                </p>
              </div>
              <Link href={`/booking?type=HOTEL&id=${hotel.id}`}>
                <Button size="lg">{t('common.bookNow')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
