'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users, Check } from 'lucide-react'
import { Car } from '@/types'
import { formatCurrency } from '@/lib/utils'
import useLocalize from '@/hooks/useLocalize'
import { useTranslation } from 'react-i18next'

interface CarCardProps {
  car: Car
}

export default function CarCard({ car }: CarCardProps) {
  const { getField, getArrayField } = useLocalize()
  const { t } = useTranslation()

  const name = getField(car, 'name')
  const description = getField(car, 'description')
  const carType = getField(car, 'car_type')
  const includes = getArrayField(car, 'includes')

  return (
    <Link href={`/cars/${car.id}`}>
      <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-56 overflow-hidden bg-slate-100">
          <Image
            src={car.images[0] || '/placeholder-car.jpg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-4 right-4 bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold">
            {carType}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 line-clamp-1">{name}</h3>
          <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4">{description}</p>

          {/* Includes */}
          <div className="flex flex-wrap gap-2 mb-4">
            {includes?.slice(0, 3).map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full"
              >
                <Check size={12} className="text-green-500" />
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 text-xs sm:text-sm">
              <Users size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span>
                {car.max_passengers} {t('common.passengers')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-bold text-indigo-600">
                {formatCurrency(car.price_per_day)}
              </span>
              <span className="text-slate-500 text-xs sm:text-sm">{t('common.perDay')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
