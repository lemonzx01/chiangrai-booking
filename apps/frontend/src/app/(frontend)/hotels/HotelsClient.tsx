/**
 * ============================================================
 * Hotels Client - listing page (Client Component)
 * ============================================================
 *
 * Premium upgrade (Phase 9):
 *   - Sticky FilterSidebar on desktop
 *   - BottomSheet filter trigger on mobile
 *   - SearchAutocomplete with thumbnails
 *   - ActiveFilterChips above results for one-tap removal
 *   - Skeleton placeholders during transition
 *
 * Filtering is still client-side (server returns the full
 * active set), and URL ↔ state sync is preserved so users
 * can share filtered links.
 * ============================================================
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Hotel } from '@chiangrai/shared/types'

import HotelCard from '@/components/cards/HotelCard'
import SearchAutocomplete from '@/components/shared/SearchAutocomplete'
import FilterSidebar, {
  FilterSidebarSheet,
  ActiveFilterChips,
  MobileFilterTrigger,
  EMPTY_FILTERS,
  countActiveFilters,
  type FilterState,
} from '@/components/shared/FilterSidebar'

interface HotelsClientProps {
  hotels: Hotel[]
  /**
   * Server hands these in from searchParams. They're plain strings —
   * we coerce / validate before merging into FilterState below.
   */
  initialFilters?: {
    q?: string
    location?: string
    price?: string
    star?: string
    sort?: string
    minPrice?: number | null
    maxPrice?: number | null
    minStar?: number | null
  }
  allLocations?: string[]
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

// Translate the legacy `?price=low|mid|high` shorthand into a min/max pair
// so we keep older shareable URLs working.
function priceRangeFromLegacy(p: string | undefined): [number | null, number | null] {
  switch (p) {
    case 'low':
      return [0, 20000]
    case 'mid':
      return [20000, 40000]
    case 'high':
      return [40000, 100000]
    default:
      return [null, null]
  }
}

export default function HotelsClient({
  hotels,
  initialFilters,
  allLocations = [],
}: HotelsClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [legacyMin, legacyMax] = priceRangeFromLegacy(initialFilters?.price)
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    q: initialFilters?.q || '',
    location: initialFilters?.location || '',
    minPrice: initialFilters?.minPrice ?? legacyMin,
    maxPrice: initialFilters?.maxPrice ?? legacyMax,
    minStar:
      initialFilters?.minStar ??
      (initialFilters?.star && initialFilters.star !== 'all'
        ? Number(initialFilters.star)
        : null),
    sort: coerceSort(initialFilters?.sort),
  })
  const [sheetOpen, setSheetOpen] = useState(false)

  // URL sync (debounced) — preserves shareable filtered links.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams()
      if (filters.q) next.set('q', filters.q)
      if (filters.location) next.set('location', filters.location)
      if (filters.minPrice != null) next.set('min_price', String(filters.minPrice))
      if (filters.maxPrice != null) next.set('max_price', String(filters.maxPrice))
      if (filters.minStar != null) next.set('star', String(filters.minStar))
      if (filters.sort && filters.sort !== 'newest') next.set('sort', filters.sort)
      const nextStr = next.toString()
      if (nextStr !== searchParams.toString()) {
        router.replace(nextStr ? `${pathname}?${nextStr}` : pathname, { scroll: false })
      }
    }, 200)
    return () => clearTimeout(t)
  }, [filters, pathname, router, searchParams])

  // Distinct locations from props (preferred) or from the dataset.
  const locations = useMemo(
    () =>
      allLocations.length > 0
        ? allLocations
        : Array.from(
            new Set(
              hotels
                .map((h) => h.location || h.location_th || h.location_en)
                .filter((s): s is string => !!s)
            )
          ),
    [allLocations, hotels]
  )

  // Apply filters client-side. Backend already returns active=true for
  // public callers; we just narrow further here.
  const visible = useMemo(() => {
    const term = filters.q.trim().toLowerCase()
    const filtered = hotels.filter((h) => {
      const loc = h.location || h.location_th || h.location_en || ''
      if (term) {
        const inName =
          h.name_th?.toLowerCase().includes(term) ||
          h.name_en?.toLowerCase().includes(term) ||
          loc.toLowerCase().includes(term)
        if (!inName) return false
      }
      if (filters.location && loc !== filters.location) return false
      if (filters.minPrice != null && (h.price_per_night || 0) < filters.minPrice)
        return false
      if (filters.maxPrice != null && (h.price_per_night || 0) > filters.maxPrice)
        return false
      if (filters.minStar != null && (h.star_rating || 0) < filters.minStar)
        return false
      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sort) {
        case 'price_asc':
          return (a.price_per_night || 0) - (b.price_per_night || 0)
        case 'price_desc':
          return (b.price_per_night || 0) - (a.price_per_night || 0)
        case 'star_desc':
          return (b.star_rating || 0) - (a.star_rating || 0)
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    return sorted
  }, [hotels, filters])

  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-slate-900 mb-3 tracking-tight">
            {t('navbar.packages')}
          </h1>
          <div className="h-px w-12 bg-slate-300 mb-4" />
          <p className="text-base sm:text-lg text-slate-600 mb-6 max-w-xl font-light">
            {t('hotels.subtitle') || 'ทุกแห่งเราไปจองด้วยตัวเอง ตอบกลับทุกข้อความ'}
          </p>
          {/* Search box on the gradient banner */}
          <div className="max-w-2xl">
            <SearchAutocomplete
              scope="hotel"
              initialValue={filters.q}
              placeholder="ค้นหาที่พัก, ที่ตั้ง, ชื่อโรงแรม..."
              onSubmit={(term) => setFilters((f) => ({ ...f, q: term }))}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="flex gap-6">
          {/* Sidebar (desktop) */}
          <FilterSidebar
            kind="hotel"
            filters={filters}
            onChange={setFilters}
            locations={locations}
            priceMin={0}
            priceMax={50000}
            resultCount={visible.length}
          />

          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 font-medium">
                {t('common.found')}{' '}
                <span className="text-indigo-600 font-semibold">{visible.length}</span>{' '}
                {t('common.packages')}
              </p>
              <MobileFilterTrigger
                onClick={() => setSheetOpen(true)}
                activeCount={countActiveFilters(filters)}
              />
            </div>

            {/* Active chips */}
            <ActiveFilterChips filters={filters} onChange={setFilters} />

            {/* Grid */}
            {visible.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {visible.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-100 p-16 text-center">
                <p className="text-slate-500 text-lg">
                  {t('hotels.noResults') || 'ไม่พบแพ็คเกจที่ตรงกับเงื่อนไข'}
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-3 text-sm text-indigo-600 font-semibold hover:underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <FilterSidebarSheet
        kind="hotel"
        filters={filters}
        onChange={setFilters}
        locations={locations}
        priceMin={0}
        priceMax={50000}
        resultCount={visible.length}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
