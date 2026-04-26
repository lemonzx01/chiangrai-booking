/**
 * ============================================================
 * SearchAutocomplete — typeahead with thumbnails for hotels/cars
 * ============================================================
 *
 * As the user types, hits the backend listing endpoint with
 * `?q=<term>&limit=6`. Results render as a dropdown with
 * thumbnail + title + short price chip. Clicking a result
 * navigates straight to the detail page.
 *
 * Behaviour:
 *   - 250ms debounce so rapid typing isn't spammy
 *   - Aborts in-flight requests when the term changes
 *   - Keyboard nav: ↑/↓ to highlight, Enter to navigate, Esc to close
 *   - Outside click closes
 *
 * Used on:
 *   - Navbar global search
 *   - Hotels listing toolbar
 *   - Cars listing toolbar
 * ============================================================
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@chiangrai/shared/utils'

interface AutocompleteResult {
  id: string
  kind: 'hotel' | 'car'
  name: string
  image: string | null
  price: number
  location?: string | null
}

interface SearchAutocompleteProps {
  /** Restricts which endpoint to query. Omit for both. */
  scope?: 'hotel' | 'car' | 'both'
  /** Initial value (e.g. from URL query). */
  initialValue?: string
  /** Submit callback — fires when user presses Enter without selecting a row. */
  onSubmit?: (term: string) => void
  /** Compact (50px) vs default (60px) styling. */
  size?: 'sm' | 'md'
  placeholder?: string
}

export default function SearchAutocomplete({
  scope = 'both',
  initialValue = '',
  onSubmit,
  size = 'md',
  placeholder = 'ค้นหาที่พัก / รถเช่า',
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [term, setTerm] = useState(initialValue)
  const [results, setResults] = useState<AutocompleteResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced fetch.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()
    if (!term.trim()) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const calls: Promise<AutocompleteResult[]>[] = []
        if (scope === 'hotel' || scope === 'both') {
          calls.push(fetchScope('hotel', term, controller.signal))
        }
        if (scope === 'car' || scope === 'both') {
          calls.push(fetchScope('car', term, controller.signal))
        }
        const lists = await Promise.all(calls)
        const merged = lists.flat().slice(0, 8)
        setResults(merged)
        setHighlight(0)
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [term, scope])

  // Outside click closes.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const list = results || []
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, list.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const picked = list[highlight]
      if (picked) {
        navigate(picked)
      } else if (onSubmit) {
        onSubmit(term.trim())
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const navigate = (r: AutocompleteResult) => {
    setOpen(false)
    setTerm('')
    router.push(`/${r.kind}s/${r.id}`)
  }

  const inputCls =
    size === 'sm'
      ? 'pl-9 pr-9 py-2 text-sm rounded-xl'
      : 'pl-11 pr-11 py-3 text-base rounded-2xl'

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${
            size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`w-full bg-white border border-slate-200 ${inputCls} focus:outline-none focus:border-indigo-400`}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {term && (
          <button
            type="button"
            onClick={() => {
              setTerm('')
              inputRef.current?.focus()
            }}
            aria-label="ล้าง"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
          </button>
        )}
      </div>

      {open && term.trim() && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 max-h-[60vh] overflow-y-auto"
        >
          {loading && !results && (
            <div className="px-4 py-6 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              กำลังค้นหา...
            </div>
          )}
          {results && results.length === 0 && !loading && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              ไม่พบผลลัพธ์ — ลองคำอื่น
            </div>
          )}
          {results && results.length > 0 && (
            <ul className="py-1">
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => navigate(r)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      highlight === i ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                      {r.image && (
                        <Image src={r.image} alt={r.name} fill sizes="48px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {r.name}
                      </div>
                      {r.location && (
                        <div className="text-[11px] text-slate-500 truncate">{r.location}</div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs font-bold text-indigo-600">
                        {formatCurrency(r.price)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        / {r.kind === 'hotel' ? 'คืน' : 'วัน'}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------
// Helper
// ---------------------------------------------------------------

async function fetchScope(
  kind: 'hotel' | 'car',
  q: string,
  signal: AbortSignal
): Promise<AutocompleteResult[]> {
  const path = kind === 'hotel' ? '/api/hotels' : '/api/cars'
  const url = `${path}?q=${encodeURIComponent(q)}&limit=4`
  const res = await fetch(url, { signal, credentials: 'include' })
  if (!res.ok) return []
  const json = (await res.json()) as { data?: Array<Record<string, unknown>> }
  const rows = json.data || []
  return rows
    .filter((r) => !!r?.id)
    .map((r) => ({
      id: String(r.id),
      kind,
      name: (r.name_th as string) || (r.name_en as string) || 'รายการ',
      image: Array.isArray(r.images) ? ((r.images[0] as string) || null) : null,
      price: Number(
        kind === 'hotel'
          ? r.base_price_per_night || r.price_per_night
          : r.base_price_per_day || r.price_per_day
      ) || 0,
      location:
        (r.location as string) ||
        (r.location_th as string) ||
        (r.location_en as string) ||
        null,
    }))
}
