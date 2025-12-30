'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Hotel } from '@/types'
import HotelCard from '@/components/cards/HotelCard'
import { Search, SlidersHorizontal } from 'lucide-react'

interface HotelsClientProps {
  hotels: Hotel[]
}

export default function HotelsClient({ hotels }: HotelsClientProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [selectedLocation, setSelectedLocation] = useState('')

  // Get unique locations
  const locations = [...new Set(hotels.map((h) => h.location))]

  // Filter hotels
  const filteredHotels = hotels.filter((hotel) => {
    const matchesSearch =
      hotel.name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPrice =
      hotel.price_per_night >= priceRange[0] && hotel.price_per_night <= priceRange[1]

    const matchesLocation = !selectedLocation || hotel.location === selectedLocation

    return matchesSearch && matchesPrice && matchesLocation
  })

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('navbar.packages')}
          </h1>
          <p className="text-xl text-white/80">
            คัดสรรแพ็คเกจที่พักพรีเมียมในราคาที่ดีที่สุด
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 -mt-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">ทุกพื้นที่</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Price Filter */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-slate-400" />
              <select
                onChange={(e) => {
                  const value = e.target.value
                  if (value === 'all') setPriceRange([0, 100000])
                  else if (value === 'low') setPriceRange([0, 20000])
                  else if (value === 'mid') setPriceRange([20000, 40000])
                  else if (value === 'high') setPriceRange([40000, 100000])
                }}
                className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">ราคาทั้งหมด</option>
                <option value="low">ต่ำกว่า ฿20,000</option>
                <option value="mid">฿20,000 - ฿40,000</option>
                <option value="high">มากกว่า ฿40,000</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-slate-500 mb-6">
          พบ {filteredHotels.length} แพ็คเกจ
        </p>

        {/* Hotels Grid */}
        {filteredHotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">ไม่พบแพ็คเกจที่ตรงกับเงื่อนไข</p>
          </div>
        )}
      </div>
    </div>
  )
}
