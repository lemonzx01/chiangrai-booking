'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Car } from '@/types'
import CarCard from '@/components/cards/CarCard'
import { Search } from 'lucide-react'

interface CarsClientProps {
  cars: Car[]
}

export default function CarsClient({ cars }: CarsClientProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.car_type_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.car_type_en.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('navbar.cars')}
          </h1>
          <p className="text-xl text-white/80">
            รถเช่าพรีเมียมพร้อมบริการคนขับมืออาชีพ
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 -mt-8">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Results Count */}
        <p className="text-slate-500 mb-6">
          พบ {filteredCars.length} รถ
        </p>

        {/* Cars Grid */}
        {filteredCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">ไม่พบรถที่ตรงกับเงื่อนไข</p>
          </div>
        )}
      </div>
    </div>
  )
}
