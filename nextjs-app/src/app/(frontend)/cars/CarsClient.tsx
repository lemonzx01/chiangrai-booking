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
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white">
            <Search className="text-slate-400 flex-shrink-0" size={20} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none border-none text-slate-800 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600 font-medium">
            {t('common.found')} <span className="text-indigo-600 font-semibold">{filteredCars.length}</span> {t('common.cars')}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              {t('common.clearSearch')} ✕
            </button>
          )}
        </div>

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
