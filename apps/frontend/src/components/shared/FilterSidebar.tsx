/**
 * ============================================================
 * FilterSidebar — premium listing filters (hotels + cars)
 * ============================================================
 *
 * One generic shape that adapts via `kind`:
 *   - kind="hotel": price range, min stars, locations, sort
 *   - kind="car":   price range, car types, min seats, sort
 *
 * Behaviour:
 *   - Desktop (≥ lg): sticky vertical sidebar
 *   - Mobile/tablet:  use the `<MobileFilterTrigger>` button + the
 *                     `<FilterSidebarSheet>` BottomSheet wrapper
 *
 * Filters are controlled — the parent owns the state and patches
 * it via `onChange`. URL ↔ state sync happens at the parent.
 *
 * Active filter chips appear above the listing grid via the
 * `<ActiveFilterChips>` helper for one-tap removal.
 * ============================================================
 */

'use client'

import { useMemo, type ReactNode } from 'react'
import { Star, X, RotateCcw } from 'lucide-react'
import { formatCurrency } from '@chiangrai/shared/utils'
import BottomSheet from './BottomSheet'

export type ListingKind = 'hotel' | 'car'

export interface FilterState {
  q: string
  minPrice: number | null
  maxPrice: number | null
  /** For hotels: minimum star rating 1..5. */
  minStar: number | null
  /** For hotels: matches `location` ilike. */
  location: string
  /** For cars: filter by `car_type`. */
  carType: string
  /** For cars: minimum `max_passengers`. */
  minSeats: number | null
  sort: 'newest' | 'price_asc' | 'price_desc' | 'star_desc' | 'rating_desc'
}

export const EMPTY_FILTERS: FilterState = {
  q: '',
  minPrice: null,
  maxPrice: null,
  minStar: null,
  location: '',
  carType: '',
  minSeats: null,
  sort: 'newest',
}

interface FilterSidebarProps {
  kind: ListingKind
  filters: FilterState
  onChange: (next: FilterState) => void
  /** Distinct location strings for hotels picker. */
  locations?: string[]
  /** Distinct car_type strings for cars picker. */
  carTypes?: string[]
  /** Lower bound for the price slider. */
  priceMin?: number
  /** Upper bound for the price slider. */
  priceMax?: number
  /** Currently visible result count (drives "see N results" pill on mobile). */
  resultCount?: number
}

// ---------------------------------------------------------------
// Inline sidebar (desktop)
// ---------------------------------------------------------------

export default function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="hidden lg:block sticky top-24 self-start w-72 flex-shrink-0">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-5 max-h-[calc(100vh-7rem)] overflow-y-auto">
        <FilterContent {...props} />
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------
// Bottom-sheet wrapper (mobile)
// ---------------------------------------------------------------

export function FilterSidebarSheet(props: FilterSidebarProps & {
  open: boolean
  onClose: () => void
}) {
  const { open, onClose, resultCount, ...rest } = props
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="กรองผลลัพธ์"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
        >
          ดูผลลัพธ์{typeof resultCount === 'number' ? ` (${resultCount})` : ''}
        </button>
      }
    >
      <FilterContent {...rest} resultCount={resultCount} />
    </BottomSheet>
  )
}

// ---------------------------------------------------------------
// Mobile trigger button (place in the listing toolbar)
// ---------------------------------------------------------------

export function MobileFilterTrigger({
  onClick,
  activeCount,
}: {
  onClick: () => void
  activeCount: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold hover:border-indigo-300"
    >
      ตัวกรอง
      {activeCount > 0 && (
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
          {activeCount}
        </span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------
// Content (shared between sidebar and sheet)
// ---------------------------------------------------------------

function FilterContent({
  kind,
  filters,
  onChange,
  locations = [],
  carTypes = [],
  priceMin = 0,
  priceMax = 100000,
}: FilterSidebarProps) {
  const patch = (p: Partial<FilterState>) => onChange({ ...filters, ...p })

  return (
    <div className="space-y-6">
      <SectionHeader title="ราคา" subtitle="THB" />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <NumberInput
            label="ต่ำสุด"
            value={filters.minPrice}
            placeholder={String(priceMin)}
            onChange={(v) => patch({ minPrice: v })}
          />
          <span className="text-slate-300">—</span>
          <NumberInput
            label="สูงสุด"
            value={filters.maxPrice}
            placeholder={String(priceMax)}
            onChange={(v) => patch({ maxPrice: v })}
          />
        </div>
        <PriceRangeSlider
          min={priceMin}
          max={priceMax}
          minValue={filters.minPrice ?? priceMin}
          maxValue={filters.maxPrice ?? priceMax}
          onChange={(min, max) => patch({ minPrice: min, maxPrice: max })}
        />
      </div>

      {kind === 'hotel' && (
        <>
          <SectionHeader title="ระดับดาว" />
          <div className="flex flex-wrap gap-1.5">
            {[5, 4, 3, 2, 1].map((s) => (
              <ToggleChip
                key={s}
                active={filters.minStar === s}
                onClick={() =>
                  patch({ minStar: filters.minStar === s ? null : s })
                }
              >
                <span className="inline-flex items-center gap-1">
                  {s}+ <Star size={12} className="fill-current" />
                </span>
              </ToggleChip>
            ))}
          </div>
        </>
      )}

      {kind === 'hotel' && locations.length > 0 && (
        <>
          <SectionHeader title="ที่ตั้ง" />
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <RadioRow
              label="ทุกที่"
              checked={!filters.location}
              onChange={() => patch({ location: '' })}
            />
            {locations.map((loc) => (
              <RadioRow
                key={loc}
                label={loc}
                checked={filters.location === loc}
                onChange={() => patch({ location: loc })}
              />
            ))}
          </div>
        </>
      )}

      {kind === 'car' && carTypes.length > 0 && (
        <>
          <SectionHeader title="ประเภทรถ" />
          <div className="flex flex-wrap gap-1.5">
            <ToggleChip
              active={!filters.carType}
              onClick={() => patch({ carType: '' })}
            >
              ทุกประเภท
            </ToggleChip>
            {carTypes.map((ct) => (
              <ToggleChip
                key={ct}
                active={filters.carType === ct}
                onClick={() =>
                  patch({ carType: filters.carType === ct ? '' : ct })
                }
              >
                {ct}
              </ToggleChip>
            ))}
          </div>
        </>
      )}

      {kind === 'car' && (
        <>
          <SectionHeader title="จำนวนผู้โดยสาร" />
          <div className="flex flex-wrap gap-1.5">
            {[2, 4, 5, 7, 9].map((n) => (
              <ToggleChip
                key={n}
                active={filters.minSeats === n}
                onClick={() =>
                  patch({ minSeats: filters.minSeats === n ? null : n })
                }
              >
                {n}+ ที่นั่ง
              </ToggleChip>
            ))}
          </div>
        </>
      )}

      <SectionHeader title="เรียงลำดับ" />
      <div className="space-y-1.5">
        {(
          [
            { v: 'newest', label: 'ใหม่ล่าสุด' },
            { v: 'price_asc', label: 'ราคา ต่ำ → สูง' },
            { v: 'price_desc', label: 'ราคา สูง → ต่ำ' },
            ...(kind === 'hotel'
              ? [{ v: 'star_desc', label: 'ดาวมากที่สุด' }]
              : []),
            { v: 'rating_desc', label: 'รีวิวสูงสุด' },
          ] as Array<{ v: FilterState['sort']; label: string }>
        ).map((opt) => (
          <RadioRow
            key={opt.v}
            label={opt.label}
            checked={filters.sort === opt.v}
            onChange={() => patch({ sort: opt.v })}
          />
        ))}
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={() => onChange(EMPTY_FILTERS)}
        className="w-full inline-flex items-center justify-center gap-1.5 mt-2 text-xs text-slate-500 hover:text-slate-800"
      >
        <RotateCcw size={12} />
        ล้างตัวกรอง
      </button>
    </div>
  )
}

// ---------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
        {title}
      </h3>
      {subtitle && <span className="text-[10px] text-slate-400">{subtitle}</span>}
    </div>
  )
}

function NumberInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: number | null
  placeholder?: string
  onChange: (v: number | null) => void
}) {
  return (
    <label className="flex-1 block">
      <span className="sr-only">{label}</span>
      <input
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value === '' ? null : Number(e.target.value)
          onChange(v)
        }}
        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-400"
      />
    </label>
  )
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
        active
          ? 'bg-indigo-600 text-white border border-indigo-600'
          : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
      }`}
    >
      {children}
    </button>
  )
}

function RadioRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

/**
 * Dual-thumb price range using two stacked range inputs with
 * a colored progress bar between them. Native + accessible.
 */
function PriceRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onChange,
}: {
  min: number
  max: number
  minValue: number
  maxValue: number
  onChange: (min: number, max: number) => void
}) {
  const minPct = ((minValue - min) / (max - min)) * 100
  const maxPct = ((maxValue - min) / (max - min)) * 100

  return (
    <div className="relative h-7 select-none">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full" />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full"
        style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }}
      />
      <input
        type="range"
        aria-label="ราคาต่ำสุด"
        min={min}
        max={max}
        value={minValue}
        onChange={(e) => {
          const v = Math.min(Number(e.target.value), maxValue)
          onChange(v, maxValue)
        }}
        className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-500"
      />
      <input
        type="range"
        aria-label="ราคาสูงสุด"
        min={min}
        max={max}
        value={maxValue}
        onChange={(e) => {
          const v = Math.max(Number(e.target.value), minValue)
          onChange(minValue, v)
        }}
        className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-500"
      />
    </div>
  )
}

// ---------------------------------------------------------------
// Active filter chips (place above results)
// ---------------------------------------------------------------

export function ActiveFilterChips({
  filters,
  onChange,
}: {
  filters: FilterState
  onChange: (next: FilterState) => void
}) {
  const chips = useMemo<Array<{ key: keyof FilterState; label: string }>>(() => {
    const out: Array<{ key: keyof FilterState; label: string }> = []
    if (filters.q) out.push({ key: 'q', label: `"${filters.q}"` })
    if (filters.minPrice != null)
      out.push({ key: 'minPrice', label: `≥ ${formatCurrency(filters.minPrice)}` })
    if (filters.maxPrice != null)
      out.push({ key: 'maxPrice', label: `≤ ${formatCurrency(filters.maxPrice)}` })
    if (filters.minStar != null)
      out.push({ key: 'minStar', label: `${filters.minStar}+ ดาว` })
    if (filters.location) out.push({ key: 'location', label: filters.location })
    if (filters.carType) out.push({ key: 'carType', label: filters.carType })
    if (filters.minSeats != null)
      out.push({ key: 'minSeats', label: `${filters.minSeats}+ ที่นั่ง` })
    return out
  }, [filters])

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() =>
            onChange({
              ...filters,
              [c.key]:
                c.key === 'minPrice' ||
                c.key === 'maxPrice' ||
                c.key === 'minStar' ||
                c.key === 'minSeats'
                  ? null
                  : '',
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
        >
          {c.label}
          <X size={12} />
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(EMPTY_FILTERS)}
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-700"
      >
        ล้างทั้งหมด
      </button>
    </div>
  )
}

/** Count active (non-empty / non-default) filter fields. */
export function countActiveFilters(filters: FilterState): number {
  let n = 0
  if (filters.q) n++
  if (filters.minPrice != null) n++
  if (filters.maxPrice != null) n++
  if (filters.minStar != null) n++
  if (filters.location) n++
  if (filters.carType) n++
  if (filters.minSeats != null) n++
  if (filters.sort && filters.sort !== 'newest') n++
  return n
}
