'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ArrowRight, Star, MapPin, Users } from 'lucide-react'
import { Hotel, Car } from '@/types'
import { formatCurrency } from '@/lib/utils'
import useLocalize from '@/hooks/useLocalize'

interface HomeClientProps {
  hotels: Hotel[]
  cars: Car[]
}

export default function HomeClient({ hotels, cars }: HomeClientProps) {
  const { t } = useTranslation()
  const { getField } = useLocalize()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full text-white/90 text-sm font-medium mb-8">
              <Sparkles size={16} className="text-yellow-400" />
              {t('home.hero.badge')}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 animate-slide-up">
            {t('home.hero.titleLine1')}
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {t('home.hero.titleHighlight')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-slide-up">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link
              href="/hotels"
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
            >
              {t('navbar.bookPackage')}
            </Link>
            <Link
              href="/cars"
              className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all active:scale-95"
            >
              {t('navbar.cars')}
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                {t('home.weeklyDeals.title')}
              </h2>
              <p className="text-slate-500 text-lg">{t('home.weeklyDeals.subtitle')}</p>
            </div>
            <Link
              href="/hotels"
              className="hidden sm:flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all"
            >
              {t('home.weeklyDeals.viewAll')}
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel) => (
              <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
                <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                      alt={getField(hotel, 'name')}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold text-slate-900">{hotel.star_rating}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                      <MapPin size={14} />
                      <span>{hotel.location}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">
                      {getField(hotel, 'name')}
                    </h3>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Users size={14} />
                        <span>{hotel.max_guests} {t('common.guests')}</span>
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
            ))}
          </div>

          <div className="sm:hidden mt-8 text-center">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 text-indigo-600 font-bold"
            >
              {t('home.weeklyDeals.viewAll')}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      {cars.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                  {t('navbar.cars')}
                </h2>
                <p className="text-slate-500 text-lg">รถเช่าพรีเมียมพร้อมคนขับ</p>
              </div>
              <Link
                href="/cars"
                className="hidden sm:flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all"
              >
                {t('home.weeklyDeals.viewAll')}
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cars.map((car) => (
                <Link key={car.id} href={`/cars/${car.id}`}>
                  <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col md:flex-row">
                    <div className="relative h-48 md:h-auto md:w-1/2 overflow-hidden">
                      <Image
                        src={car.images[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'}
                        alt={getField(car, 'name')}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-6 md:w-1/2 flex flex-col justify-center">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                        {getField(car, 'car_type')}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {getField(car, 'name')}
                      </h3>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                        {getField(car, 'description')}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Users size={14} />
                          <span>{car.max_passengers} {t('common.passengers')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-indigo-600">
                            {formatCurrency(car.price_per_day)}
                          </span>
                          <span className="text-slate-500 text-sm">{t('common.perDay')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            พร้อมออกเดินทางหรือยัง?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            จองแพ็คเกจเที่ยวสุดพิเศษวันนี้ รับส่วนลดพิเศษ
          </p>
          <Link
            href="/hotels"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all active:scale-95"
          >
            เริ่มจองเลย
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  )
}
