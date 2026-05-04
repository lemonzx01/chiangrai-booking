/**
 * ============================================================
 * RecentlyViewed — horizontal scroller of viewed listings
 * ============================================================
 *
 * Reads the localStorage history maintained by useRecentlyViewed,
 * fetches the actual hotel/car records (so titles, images, prices
 * stay fresh even if a partner edited them), and renders a
 * horizontal scroll strip.
 *
 * Optional `excludeId` skips the current listing — handy when
 * mounted on a detail page so it doesn't show "you just viewed
 * the page you're on right now".
 *
 * Renders nothing if there's nothing to show, so callers can
 * safely include it on every page without conditional logic.
 * ============================================================
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Clock } from 'lucide-react'
import { formatCurrency } from '@chiangrai/shared/utils'
import useRecentlyViewed, { type ViewedEntry } from '@/hooks/useRecentlyViewed'
import { ThumbStripSkeleton } from './Skeletons'

interface RecentlyViewedProps {
  /** Listing id to omit (e.g. the current detail page). */
  excludeId?: string
  /** Section heading. */
  title?: string
}

interface ResolvedItem {
  kind: 'hotel' | 'car'
  id: string
  name: string
  image: string | null
  price: number
  rating?: number | null
}

export default function RecentlyViewed({
  excludeId,
  title = 'ดูล่าสุด',
}: RecentlyViewedProps) {
  const { items } = useRecentlyViewed()
  const [resolved, setResolved] = useState<ResolvedItem[] | null>(null)

  useEffect(() => {
    const filtered = items.filter((e) => e.id !== excludeId)
    if (filtered.length === 0) {
      setResolved([])
      return
    }
    let cancelled = false
    void resolveAll(filtered).then((rs) => {
      if (!cancelled) setResolved(rs)
    })
    return () => {
      cancelled = true
    }
  }, [items, excludeId])

  // Loading state shows skeletons rather than collapsing,
  // to avoid layout shift when data arrives.
  if (resolved === null) {
    return (
      <section aria-label={title} className="py-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-slate-400" />
          {title}
        </h2>
        <ThumbStripSkeleton count={4} />
      </section>
    )
  }

  if (resolved.length === 0) return null

  return (
    <section aria-label={title} className="py-8">
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Clock size={18} className="text-slate-400" />
        {title}
      </h2>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {resolved.map((item) => (
          <Link
            key={`${item.kind}-${item.id}`}
            href={`/${item.kind}s/${item.id}`}
            className="group flex-shrink-0 w-44 sm:w-52 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="relative h-28 sm:h-32 bg-slate-100 overflow-hidden">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 176px, 208px"
                  className="object-cover img-zoom"
                />
              ) : null}
              {item.rating != null && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <Star size={11} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-[11px] font-bold text-slate-900">
                    {item.rating}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                {item.name}
              </div>
              <div className="mt-1 text-xs text-slate-900 font-bold">
                {formatCurrency(item.price)}
                <span className="text-slate-400 font-normal ml-1">
                  / {item.kind === 'hotel' ? 'คืน' : 'วัน'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------
// Resolve a list of viewed entries to display data.
// Hotel rows return { name_th, images, price_per_night, star_rating }
// Car rows return    { name_th, images, price_per_day }
// ---------------------------------------------------------------

async function resolveAll(entries: ViewedEntry[]): Promise<ResolvedItem[]> {
  const out = await Promise.all(entries.map(resolveOne))
  return out.filter((x): x is ResolvedItem => !!x)
}

async function resolveOne(entry: ViewedEntry): Promise<ResolvedItem | null> {
  try {
    const path = entry.kind === 'hotel' ? `/api/hotels/${entry.id}` : `/api/cars/${entry.id}`
    const res = await fetch(path, { credentials: 'include' })
    if (!res.ok) return null
    const json = (await res.json()) as Record<string, unknown>
    const data = ((json as { data?: Record<string, unknown> }).data || json) as Record<string, unknown>

    return {
      kind: entry.kind,
      id: entry.id,
      name: (data.name_th as string) || (data.name_en as string) || 'รายการ',
      image:
        (Array.isArray(data.images) ? (data.images[0] as string) : null) ||
        (data.image as string) ||
        null,
      price:
        Number(
          entry.kind === 'hotel'
            ? data.base_price_per_night || data.price_per_night
            : data.base_price_per_day || data.price_per_day
        ) || 0,
      rating: entry.kind === 'hotel' ? Number(data.star_rating || 0) || null : null,
    }
  } catch {
    return null
  }
}
