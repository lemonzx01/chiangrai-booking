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
import { Star, X, RotateCcw, Check } from 'lucide-react'
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
            {[5, 4, 3, 2, 1].map((s) => {
              const active = filters.minStar === s
              return (
                <ToggleChip
                  key={s}
                  active={active}
                  onClick={() =>
                    patch({ minStar: active ? null : s })
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {s}+
                    <Star
                      size={11}
                      className={
                        active
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-amber-500 text-amber-500'
                      }
                    />
                  </span>
                </ToggleChip>
              )
            })}
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
    <div className="flex items-baseline justify-between mb-3">
      {/* Editorial section header — title-case, no uppercase, sits on
          its own line. The previous "TINY UPPERCASE TRACKING-WIDER"
          look reads as Stripe/SaaS-template; sentence case reads as
          a real magazine. */}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && (
        <span className="text-[11px] text-slate-400 uppercase tracking-wide">
          {subtitle}
        </span>
      )}
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
        // Slate focus ring — stays in the editorial palette, not
        // tailwind-default-indigo.
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-500 transition-colors"
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
  // Active state: dark slate fill, white text. The previous
  // saturated indigo-600 was the strongest "template" signal in
  // the sidebar. Inactive: plain text + light border, hovers
  // darken the border (no color shift).
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-slate-900 text-white border border-slate-900'
          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
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
  // Editorial radio: visible-only-when-selected check-mark on the
  // right side instead of the native blue radio circle. The label
  // weight emphasizes the active state typographically; the
  // check is just confirmation. The native input is hidden but
  // keyboard-reachable for a11y.
  return (
    <label className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`text-sm transition-colors ${
          checked ? 'text-slate-900 font-semibold' : 'text-slate-600'
        }`}
      >
        {label}
      </span>
      {checked && (
        <Check size={14} className="text-slate-900 flex-shrink-0" />
      )}
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

  // Slate palette — track is light gray with a darker selected
  // segment, thumbs are white circles ringed in slate-900. The
  // previous indigo-500 fill was the loudest spot of color in
  // the entire sidebar.
  const thumbStyles =
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900'

  return (
    <div className="relative h-6 select-none">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200" />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-slate-900"
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
        className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none ${thumbStyles}`}
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
        className={`absolute inset-0 w-full appearance-none bg-transparent pointer-events-none ${thumbStyles}`}
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
