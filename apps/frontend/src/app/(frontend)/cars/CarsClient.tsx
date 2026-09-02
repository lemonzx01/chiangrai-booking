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
import DestinationChips from '@/components/shared/DestinationChips'
import EmptyState from '@/components/ui/EmptyState'
import { SearchX } from 'lucide-react'
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

// Cars don't carry star/rating in their schema, so we only honor sorts
// the comparator below actually implements. Hotels' sort set lives in
// HotelsClient where star/rating are real fields.
const VALID_SORTS: ReadonlySet<FilterState['sort']> = new Set([
  'newest',
  'price_asc',
  'price_desc',
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
      <div className="bg-white border-b border-slate-200 py-7 sm:py-9">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-slate-900 mb-2 tracking-tight">
            {t('navbar.cars')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mb-5 max-w-xl font-light">
            {t('cars.subtitle') || 'ประกันชั้น 1 ทุกคัน ส่งฟรีในเขตเมือง ไม่ต้องวางบัตรค้ำประกัน'}
          </p>
          <div className="max-w-2xl">
            <SearchAutocomplete
              scope="car"
              initialValue={filters.q}
              placeholder="ค้นหารถ, ประเภท..."
              onSubmit={(term) => setFilters((f) => ({ ...f, q: term }))}
            />
          </div>

          {/* Destination quick-chips — same parity as /hotels.
              Cars have no location field, so chips set the search
              query instead, acting as a popular-search shortcut. */}
          <div className="mt-4">
            <DestinationChips
              current={filters.q}
              onChange={(loc) => setFilters((f) => ({ ...f, q: loc }))}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
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
                <span className="text-slate-900 font-semibold">{visible.length}</span>{' '}
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
              <EmptyState
                icon={SearchX}
                title={t('cars.noResults') || 'ไม่พบรถที่ตรงกับเงื่อนไข'}
                description="ลองปรับช่วงราคา จำนวนที่นั่ง หรือเปลี่ยนประเภทรถใหม่ดูครับ"
                action={{
                  label: 'ล้างตัวกรองทั้งหมด',
                  onClick: () => setFilters(EMPTY_FILTERS),
                }}
              />
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
