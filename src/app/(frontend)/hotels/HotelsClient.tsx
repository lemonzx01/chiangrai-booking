'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Hotel } from '@/types'
import HotelCard from '@/components/cards/HotelCard'
import { Search, MapPin, Banknote, ChevronDown, Check, LucideIcon } from 'lucide-react'

interface HotelsClientProps {
  hotels: Hotel[]
}

// Custom Dropdown Component
interface DropdownOption {
  value: string
  label: string
}

function CustomDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder,
  icon: Icon
}: { 
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: LucideIcon
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const selectedOption = options.find(opt => opt.value === value)
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative w-full lg:min-w-[200px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 text-sm sm:text-base ${
          isOpen 
            ? 'bg-white ring-2 ring-indigo-500 shadow-lg' 
            : 'bg-slate-50 hover:bg-white hover:shadow-md'
        }`}
      >
        <Icon className={`flex-shrink-0 transition-colors ${isOpen ? 'text-indigo-600' : 'text-slate-400'}`} size={18} />
        <span className={`flex-1 text-left font-medium ${selectedOption?.value ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} size={16} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-indigo-500 z-50 overflow-visible">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-all text-left group
                ${value === option.value 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-700 hover:bg-slate-50'
                }
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === options.length - 1 ? 'rounded-b-lg' : ''}
              `}
            >
              <span className={`${value === option.value ? 'font-semibold' : 'font-medium'}`}>
                {option.label}
              </span>
              {value === option.value && (
                <Check size={16} className="text-white" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HotelsClient({ hotels }: HotelsClientProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [priceFilter, setPriceFilter] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('')

  // Get unique locations
  const locations = [...new Set(hotels.map((h) => h.location || h.location_th || h.location_en).filter(Boolean))] as string[]

  // Price ranges
  const getPriceRange = (filter: string): [number, number] => {
    switch (filter) {
      case 'low': return [0, 20000]
      case 'mid': return [20000, 40000]
      case 'high': return [40000, 100000]
      default: return [0, 100000]
    }
  }

  const priceRange = getPriceRange(priceFilter)

  // Filter hotels
  const filteredHotels = hotels.filter((hotel) => {
    const hotelLocation = hotel.location || hotel.location_th || hotel.location_en || ''
    const matchesSearch =
      hotel.name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotelLocation.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPrice =
      hotel.price_per_night >= priceRange[0] && hotel.price_per_night <= priceRange[1]

    const matchesLocation = !selectedLocation || hotelLocation === selectedLocation

    return matchesSearch && matchesPrice && matchesLocation
  })

  // Dropdown options
  const locationOptions: DropdownOption[] = [
    { value: '', label: t('common.allLocations') },
    ...locations.map(loc => ({ value: loc, label: loc }))
  ]

  const priceOptions: DropdownOption[] = [
    { value: 'all', label: t('common.allPrices') },
    { value: 'low', label: t('common.priceLow') },
    { value: 'mid', label: t('common.priceMid') },
    { value: 'high', label: t('common.priceHigh') },
  ]

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('navbar.packages')}
          </h1>
          <p className="text-xl text-white/80">
            {t('hotels.subtitle') || 'คัดสรรแพ็คเกจที่พักพรีเมียมในราคาที่ดีที่สุด'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        {/* Filters */}
        <div className="relative bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 overflow-visible z-20">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-visible">
            {/* Search */}
            <div className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white">
              <Search className="text-slate-400 flex-shrink-0" size={18} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none border-none text-sm sm:text-base text-slate-800 font-medium placeholder:text-slate-400"
              />
            </div>

            {/* Location Dropdown */}
            <CustomDropdown
              options={locationOptions}
              value={selectedLocation}
              onChange={setSelectedLocation}
              placeholder={t('common.allLocations')}
              icon={MapPin}
            />

            {/* Price Dropdown */}
            <CustomDropdown
              options={priceOptions}
              value={priceFilter}
              onChange={setPriceFilter}
              placeholder={t('common.allPrices')}
              icon={Banknote}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600 font-medium">
            {t('common.found')} <span className="text-indigo-600 font-semibold">{filteredHotels.length}</span> {t('common.packages')}
          </p>
          {(searchTerm || selectedLocation || priceFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedLocation('')
                setPriceFilter('all')
              }}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              {t('common.clearFilters')} ✕
            </button>
          )}
        </div>

        {/* Hotels Grid */}
        {filteredHotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">{t('hotels.noResults') || 'ไม่พบแพ็คเกจที่ตรงกับเงื่อนไข'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
