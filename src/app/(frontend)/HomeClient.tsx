'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Star, MapPin, Users, Search, Calendar, Minus, Plus } from 'lucide-react'
import { Hotel, Car } from '@/types'
import { formatCurrency } from '@/lib/utils'
import useLocalize from '@/hooks/useLocalize'
import DateRangePicker from '@/components/ui/DateRangePicker'
import CustomSelect from '@/components/ui/CustomSelect'

interface HomeClientProps {
  hotels: Hotel[]
  cars: Car[]
}

export default function HomeClient({ hotels, cars }: HomeClientProps) {
  const { t, i18n } = useTranslation()
  const { getField } = useLocalize()
  const router = useRouter()
  const [guests, setGuests] = useState(2)
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const lang = mounted ? i18n.language : 'th'

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (destination) params.set('destination', destination)
    if (startDate) params.set('date', startDate.toISOString())
    if (endDate) params.set('returnDate', endDate.toISOString())
    if (guests) params.set('guests', guests.toString())
    router.push(`/hotels?${params.toString()}`)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-visible pt-24">
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
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 animate-slide-up">
            {t('home.hero.titleLine1')}
            <br />
            {t('home.hero.titleHighlight')}
          </h1>

          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-12 animate-slide-up">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up mb-12">
            <Link
              href="/hotels"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all"
            >
              {t('navbar.bookPackage')}
            </Link>
            <Link
              href="/cars"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
            >
              {t('navbar.cars')}
            </Link>
          </div>

          {/* Search Box */}
          <div className="mt-14 max-w-5xl mx-auto animate-slide-up px-4 overflow-visible relative z-10">
            <div className="bg-[#ffffff] rounded-2xl shadow-2xl overflow-visible backdrop-blur-none border-2 border-slate-200">
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto_auto] gap-0 overflow-visible items-stretch">
                {/* Destination */}
                <div className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors overflow-visible relative z-30 lg:border-r border-slate-200 cursor-pointer group">
                  <MapPin className="text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" size={22} />
                  <div className="overflow-visible min-w-[140px]">
                    <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1 whitespace-nowrap">
                      {t('home.search.destination')}
                    </label>
                    <CustomSelect
                      value={destination}
                      onChange={setDestination}
                      placeholder={lang === 'th' ? 'เลือกจังหวัด' : 'Select province'}
                      options={[
                        { value: 'Chiang Rai', label: lang === 'th' ? 'เชียงราย' : 'Chiang Rai', code: 'CRI' },
                        { value: 'Chiang Mai', label: lang === 'th' ? 'เชียงใหม่' : 'Chiang Mai', code: 'CNX' },
                        { value: 'Phuket', label: lang === 'th' ? 'ภูเก็ต' : 'Phuket', code: 'HKT' },
                        { value: 'Bangkok', label: lang === 'th' ? 'กรุงเทพฯ' : 'Bangkok', code: 'BKK' },
                      ]}
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors lg:border-r border-slate-200 cursor-pointer group overflow-visible">
                  <Calendar className="text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" size={22} />
                  <div className="min-w-[180px] overflow-visible">
                    <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1 whitespace-nowrap">
                      {lang === 'th' ? 'วันเข้าพัก - คืนห้อง' : 'Check-in - Check-out'}
                    </label>
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(dates) => {
                        setStartDate(dates[0])
                        setEndDate(dates[1])
                      }}
                      placeholder={lang === 'th' ? 'เลือกวันที่' : 'Select dates'}
                      minDate={new Date()}
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors lg:border-r border-slate-200 group">
                  <Users className="text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" size={22} />
                  <div className="min-w-[120px]">
                    <label className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1 whitespace-nowrap">
                      {t('home.search.guests')}
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                        disabled={guests <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-lg text-slate-900 font-bold min-w-[32px] text-center">
                        {guests}
                      </span>
                      <button
                        onClick={() => setGuests(guests + 1)}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90 flex items-center justify-center font-bold"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 px-8 py-4 m-2 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 transition-all active:scale-95 shadow-lg hover:shadow-xl shadow-indigo-600/30 min-h-[70px]"
                >
                  <Search size={20} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">{t('home.search.button')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              {t('home.weeklyDeals.title')}
            </h2>
            <Link
              href="/hotels"
              className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all"
            >
              {t('home.weeklyDeals.viewAll')}
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Link key={hotel.id} href={`/hotels/${hotel.id}`}>
                <div className="group bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                      alt={getField(hotel, 'name')}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-sm">
                      <Star size={13} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold text-slate-900">{hotel.star_rating}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2">
                      <MapPin size={12} />
                      <span>{getField(hotel, 'location')}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-3 line-clamp-1">
                      {getField(hotel, 'name')}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Users size={12} />
                        <span>{hotel.max_guests} {t('common.guests')}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-indigo-600">
                          {formatCurrency(hotel.price_per_night)}
                        </span>
                        <span className="text-slate-500 text-xs">{t('common.perNight')}</span>
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
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                {t('navbar.cars')}
              </h2>
              <Link
                href="/cars"
                className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all"
              >
                {t('home.weeklyDeals.viewAll')}
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cars.map((car) => (
                <Link key={car.id} href={`/cars/${car.id}`}>
                  <div className="group bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col md:flex-row">
                    <div className="relative h-40 md:h-auto md:w-5/12 overflow-hidden">
                      <Image
                        src={car.images[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'}
                        alt={getField(car, 'name')}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 md:w-7/12 flex flex-col justify-center">
                      <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                        {getField(car, 'car_type')}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mb-4">
                        {getField(car, 'name')}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Users size={12} />
                          <span>{car.max_passengers} {t('common.passengers')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-indigo-600">
                            {formatCurrency(car.price_per_day)}
                          </span>
                          <span className="text-slate-500 text-xs">{t('common.perDay')}</span>
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
    </div>
  )
}
