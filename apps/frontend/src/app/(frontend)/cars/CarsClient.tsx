/**
 * ============================================================
 * Cars Client - หน้ารายการรถเช่า (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการรถเช่าพร้อมระบบค้นหา
 *   - รองรับการค้นหาตามชื่อและประเภทรถ
 *   - รองรับการเปลี่ยนภาษา (Thai/English)
 *
 * Features:
 *   - Search Box ค้นหาตามชื่อ/ประเภท
 *   - Car Cards แสดงผลแบบ Grid
 *   - ปุ่ม Clear Search
 *   - Empty State เมื่อไม่พบผลลัพธ์
 *
 * การใช้งาน:
 *   <CarsClient cars={carsArray} />
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state */
import { useEffect, useState } from 'react'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/** Type definition สำหรับข้อมูลรถ */
import { Car } from '@chiangrai/shared/types'

/** Car Card component สำหรับแสดงข้อมูลรถแต่ละคัน */
import CarCard from '@/components/cards/CarCard'

/** Lucide icons สำหรับ UI */
import { Search, ArrowUpDown, Banknote, Users } from 'lucide-react'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Props interface สำหรับ CarsClient
 *
 * @property {Car[]} cars - รายการรถที่จะแสดง
 */
interface CarsClientProps {
  cars: Car[]
  initialFilters?: {
    q?: string
    car_type?: string
    price?: string
    passengers?: string
    sort?: string
  }
  allCarTypes?: string[]
}

// ============================================================
// Main Component
// ============================================================

/**
 * Client Component สำหรับแสดงรายการรถเช่า
 *
 * @description
 *   Component หลักที่แสดงรายการรถพร้อมระบบค้นหา
 *   รับข้อมูลรถจาก Server Component และจัดการ filtering
 *
 *   โครงสร้าง UI:
 *   - Header พร้อม title และ subtitle (Gradient)
 *   - Search Box
 *   - Results Count และ Clear Search
 *   - Cars Grid (3 columns on desktop)
 *   - Empty State เมื่อไม่พบผลลัพธ์
 *
 * @param {CarsClientProps} props - Props ที่มีรายการรถ
 * @returns {JSX.Element} Cars listing UI
 *
 * @example
 *   <CarsClient cars={carsArray} />
 */
export default function CarsClient({
  cars,
  initialFilters,
  allCarTypes = [],
}: CarsClientProps) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /** State สำหรับคำค้นหา */
  const [searchTerm, setSearchTerm] = useState(initialFilters?.q || '')
  const [selectedType, setSelectedType] = useState(initialFilters?.car_type || '')
  const [priceFilter, setPriceFilter] = useState(initialFilters?.price || 'all')
  const [passengerFilter, setPassengerFilter] = useState(initialFilters?.passengers || 'all')
  const [sortFilter, setSortFilter] = useState(initialFilters?.sort || 'newest')

  useEffect(() => {
    setSearchTerm(initialFilters?.q || '')
    setSelectedType(initialFilters?.car_type || '')
    setPriceFilter(initialFilters?.price || 'all')
    setPassengerFilter(initialFilters?.passengers || 'all')
    setSortFilter(initialFilters?.sort || 'newest')
  }, [
    initialFilters?.q,
    initialFilters?.car_type,
    initialFilters?.price,
    initialFilters?.passengers,
    initialFilters?.sort,
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams()

      if (searchTerm.trim()) next.set('q', searchTerm.trim())
      if (selectedType) next.set('car_type', selectedType)
      if (priceFilter && priceFilter !== 'all') next.set('price', priceFilter)
      if (passengerFilter && passengerFilter !== 'all') next.set('passengers', passengerFilter)
      if (sortFilter && sortFilter !== 'newest') next.set('sort', sortFilter)

      const nextQuery = next.toString()
      const currentQuery = searchParams.toString()
      if (nextQuery !== currentQuery) {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [
    searchTerm,
    selectedType,
    priceFilter,
    passengerFilter,
    sortFilter,
    pathname,
    router,
    searchParams,
  ])

  // ----------------------------------------------------------
  // Filter Cars
  // ----------------------------------------------------------
  /**
   * กรองรถตามคำค้นหา
   *
   * ค้นหาใน:
   * - ชื่อรถ (ไทย/อังกฤษ)
   * - ประเภทรถ (ไทย/อังกฤษ)
   */
  const getCarPriceRange = (filter: string): [number, number] => {
    switch (filter) {
      case 'low':
        return [0, 2000]
      case 'mid':
        return [2000, 5000]
      case 'high':
        return [5000, 100000]
      default:
        return [0, 100000]
    }
  }

  const [minPrice, maxPrice] = getCarPriceRange(priceFilter)

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.car_type_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.car_type_en.toLowerCase().includes(searchTerm.toLowerCase())

    const currentType = (car.car_type_th || car.car_type_en || '').toLowerCase()
    const matchesType = !selectedType || currentType === selectedType.toLowerCase()

    const price = Number(car.price_per_day) || 0
    const matchesPrice = price >= minPrice && price <= maxPrice

    const minPassengers = passengerFilter === 'all' ? 0 : Number(passengerFilter) || 0
    const matchesPassengers = (car.max_passengers || 0) >= minPassengers

    return matchesSearch && matchesType && matchesPrice && matchesPassengers
  })

  const sortedCars = [...filteredCars].sort((a, b) => {
    if (sortFilter === 'price_asc') return a.price_per_day - b.price_per_day
    if (sortFilter === 'price_desc') return b.price_per_day - a.price_per_day
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const typeOptions = [
    ...new Set(
      (allCarTypes.length > 0 ? allCarTypes : cars.map((car) => car.car_type_th || car.car_type_en)).filter(Boolean)
    ),
  ] as string[]

  const sortOptions = [
    { value: 'newest', label: t('common.newest') || 'ใหม่ล่าสุด' },
    { value: 'price_asc', label: t('common.priceLow') || 'ราคาต่ำไปสูง' },
    { value: 'price_desc', label: t('common.priceHigh') || 'ราคาสูงไปต่ำ' },
  ]

  const priceOptions = [
    { value: 'all', label: t('common.allPrices') || 'ทุกราคา' },
    { value: 'low', label: 'ต่ำกว่า 2,000 / วัน' },
    { value: 'mid', label: '2,000 - 5,000 / วัน' },
    { value: 'high', label: 'สูงกว่า 5,000 / วัน' },
  ]

  const passengerOptions = [
    { value: 'all', label: 'ทุกจำนวนที่นั่ง' },
    { value: '2', label: '2+ ที่นั่ง' },
    { value: '4', label: '4+ ที่นั่ง' },
    { value: '6', label: '6+ ที่นั่ง' },
    { value: '8', label: '8+ ที่นั่ง' },
  ]

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* ============================================================
          Header Section - Gradient Background (สีเทาเข้ม)
          ============================================================ */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('navbar.cars')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-white/80">
            {t('cars.subtitle') || 'รถเช่าพรีเมียมพร้อมบริการคนขับมืออาชีพ'}
          </p>
        </div>
      </div>

      {/* ============================================================
          Main Content
          ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        {/* ============================================================
            Search Box
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
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

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full lg:w-56 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:text-base text-slate-700 focus:border-indigo-500 outline-none"
            >
              <option value="">{t('common.allTypes') || 'ทุกประเภทรถ'}</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <div className="relative w-full lg:w-56">
              <Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm sm:text-base text-slate-700 focus:border-indigo-500 outline-none"
              >
                {priceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full lg:w-56">
              <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={passengerFilter}
                onChange={(e) => setPassengerFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm sm:text-base text-slate-700 focus:border-indigo-500 outline-none"
              >
                {passengerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full lg:w-56">
              <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm sm:text-base text-slate-700 focus:border-indigo-500 outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================
            Results Count และ Clear Search
            ============================================================ */}
        <div className="flex items-center justify-between mb-6">
          {/* จำนวนผลลัพธ์ */}
          <p className="text-slate-600 font-medium">
            {t('common.found')} <span className="text-indigo-600 font-semibold">{sortedCars.length}</span> {t('common.cars')}
          </p>

          {/* ปุ่ม Clear Search - แสดงเมื่อมีคำค้นหา */}
          {(searchTerm ||
            selectedType ||
            priceFilter !== 'all' ||
            passengerFilter !== 'all' ||
            sortFilter !== 'newest') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedType('')
                setPriceFilter('all')
                setPassengerFilter('all')
                setSortFilter('newest')
              }}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              {t('common.clearSearch')} ✕
            </button>
          )}
        </div>

        {/* ============================================================
            Cars Grid หรือ Empty State
            ============================================================ */}
        {sortedCars.length > 0 ? (
          // Cars Grid - 1 column mobile, 2 tablet, 3 desktop
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {sortedCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          // Empty State - เมื่อไม่พบผลลัพธ์
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">{t('cars.noResults') || 'ไม่พบรถที่ตรงกับเงื่อนไข'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
