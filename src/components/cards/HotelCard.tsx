'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Users } from 'lucide-react'
import { Hotel } from '@/types'
import { formatCurrency } from '@/lib/utils'
import useLocalize from '@/hooks/useLocalize'
import { useTranslation } from 'react-i18next'

interface HotelCardProps {
  hotel: Hotel
}

export default function HotelCard({ hotel }: HotelCardProps) {
  const { getField } = useLocalize()
  const { t } = useTranslation()

  const name = getField(hotel, 'name')
  const description = getField(hotel, 'description')
  const roomType = getField(hotel, 'room_type')

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <Image
            src={hotel.images[0] || '/placeholder-hotel.jpg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-bold text-slate-900">{hotel.star_rating}</span>
          </div>
          <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold">
            {roomType}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <MapPin size={14} />
            <span>{getField(hotel, 'location')}</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{name}</h3>
          <p className="text-slate-500 text-sm line-clamp-2 mb-4">{description}</p>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Users size={14} />
              <span>
                {hotel.max_guests} {t('common.guests')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-indigo-600">
                {formatCurrency(hotel.price_per_night)}
              </span>
              <span className="text-slate-500 text-sm">{t('common.perNight')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
