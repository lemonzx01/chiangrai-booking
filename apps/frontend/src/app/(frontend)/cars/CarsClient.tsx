/**
 * ============================================================
 * Cars Client - listing page (Client Component)
 * ============================================================
 *
 * Premium upgrade (Phase 9):
 *   - Sticky FilterSidebar on desktop
 *   - BottomSheet filter on mobile
 *   - SearchAutocomplete with thumbnails
 *   - ActiveFilterChips above results
 *
 * Same shape and conventions as HotelsClient — they share the
 * FilterState type so the sidebar can render either kind.
 * ============================================================
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Car } from '@chiangrai/shared/types'
import CarCard from '@/components/cards/CarCard'
import SearchAutocomplete from '@/components/shared/SearchAutocomplete'
import FilterSidebar, {
  FilterSidebarSheet,
  ActiveFilterChips,
  MobileFilterTrigger,
  EMPTY_FILTERS,
  countActiveFilters,
  type FilterState,
} from '@/components/shared/FilterSidebar'

interface CarsClientProps {
  cars: Car[]
  initialFilters?: {
    q?: string
    car_type?: string
    carType?: string
    price?: string
    passengers?: string
    sort?: string
    minPrice?: number | null
    maxPrice?: number | null
    minSeats?: number | null
  }
  allCarTypes?: string[]
}

const VALID_SORTS: ReadonlySet<FilterState['sort']> = new Set([
  'newest',
  'price_asc',
  'price_desc',
  'star_desc',
  'rating_desc',
])
function coerceSort(s?: string): FilterState['sort'] {
  return s && VALID_SORTS.has(s as FilterState['sort']) ? (s as FilterState['sort']) : 'newest'
}

function priceRangeFromLegacy(p: string | undefined): [number | null, number | null] {
  switch (p) {
    case 'low':
      return [0, 1500]
    case 'mid':
      return [1500, 4000]
    case 'high':
      return [4000, 50000]
    default:
      return [null, null]
  }
}

export default function CarsClient({
  cars,
  initialFilters,
  allCarTypes = [],
}: CarsClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [legacyMin, legacyMax] = priceRangeFromLegacy(initialFilters?.price)
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    q: initialFilters?.q || '',
    carType: initialFilters?.carType ?? initialFilters?.car_type ?? '',
    minPrice: initialFilters?.minPrice ?? legacyMin,
    maxPrice: initialFilters?.maxPrice ?? legacyMax,
    minSeats:
      initialFilters?.minSeats ??
      (initialFilters?.passengers && initialFilters.passengers !== 'all'
        ? Number(initialFilters.passengers)
        : null),
    sort: coerceSort(initialFilters?.sort),
  })
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams()
      if (filters.q) next.set('q', filters.q)
      if (filters.carType) next.set('car_type', filters.carType)
      if (filters.minPrice != null) next.set('min_price', String(filters.minPrice))
      if (filters.maxPrice != null) next.set('max_price', String(filters.maxPrice))
      if (filters.minSeats != null) next.set('passengers', String(filters.minSeats))
      if (filters.sort && filters.sort !== 'newest') next.set('sort', filters.sort)
      const nextStr = next.toString()
      if (nextStr !== searchParams.toString()) {
        router.replace(nextStr ? `${pathname}?${nextStr}` : pathname, { scroll: false })
      }
    }, 200)
    return () => clearTimeout(t)
  }, [filters, pathname, router, searchParams])

  const carTypes = useMemo(
    () =>
      allCarTypes.length > 0
        ? allCarTypes
        : Array.from(
            new Set(
              cars
                .map((c) => c.car_type_th || c.car_type_en)
                .filter((s): s is string => !!s)
            )
          ),
    [allCarTypes, cars]
  )

  const visible = useMemo(() => {
    const term = filters.q.trim().toLowerCase()
    const filtered = cars.filter((c) => {
      if (term) {
        const inText =
          c.name_th?.toLowerCase().includes(term) ||
          c.name_en?.toLowerCase().includes(term) ||
          c.car_type_th?.toLowerCase().includes(term) ||
          c.car_type_en?.toLowerCase().includes(term)
        if (!inText) return false
      }
      if (
        filters.carType &&
        !(c.car_type_th === filters.carType || c.car_type_en === filters.carType)
      )
        return false
      if (filters.minPrice != null && (c.price_per_day || 0) < filters.minPrice)
        return false
      if (filters.maxPrice != null && (c.price_per_day || 0) > filters.maxPrice)
        return false
      if (filters.minSeats != null && (c.max_passengers || 0) < filters.minSeats)
        return false
      return true
    })

    return [...filtered].sort((a, b) => {
      switch (filters.sort) {
        case 'price_asc':
          return (a.price_per_day || 0) - (b.price_per_day || 0)
        case 'price_desc':
          return (b.price_per_day || 0) - (a.price_per_day || 0)
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [cars, filters])

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">
            {t('navbar.cars')}
          </h1>
          <p className="text-base sm:text-xl text-white/80 mb-6">
            {t('cars.subtitle') || 'รถเช่าพรีเมียม คุณภาพคัดสรร พร้อมประกันครบ'}
          </p>
          <div className="max-w-2xl">
            <SearchAutocomplete
              scope="car"
              initialValue={filters.q}
              placeholder="ค้นหารถ, ประเภท..."
              onSubmit={(term) => setFilters((f) => ({ ...f, q: term }))}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="flex gap-6">
          <FilterSidebar
            kind="car"
            filters={filters}
            onChange={setFilters}
            carTypes={carTypes}
            priceMin={0}
            priceMax={10000}
            resultCount={visible.length}
          />

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 font-medium">
                {t('common.found')}{' '}
                <span className="text-emerald-600 font-semibold">{visible.length}</span>{' '}
                {t('common.cars') || 'รายการ'}
              </p>
              <MobileFilterTrigger
                onClick={() => setSheetOpen(true)}
                activeCount={countActiveFilters(filters)}
              />
            </div>

            <ActiveFilterChips filters={filters} onChange={setFilters} />

            {visible.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {visible.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-100 p-16 text-center">
                <p className="text-slate-500 text-lg">
                  {t('cars.noResults') || 'ไม่พบรถที่ตรงกับเงื่อนไข'}
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-3 text-sm text-emerald-600 font-semibold hover:underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <FilterSidebarSheet
        kind="car"
        filters={filters}
        onChange={setFilters}
        carTypes={carTypes}
        priceMin={0}
        priceMax={10000}
        resultCount={visible.length}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
