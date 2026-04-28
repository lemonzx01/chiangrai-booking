/**
 * ============================================================
 * Wishlist Page — /wishlist
 * ============================================================
 *
 * Customer-facing list of "saved" hotels and cars. Same
 * resolve-from-localStorage pattern as RecentlyViewed:
 *   1. Read entries from localStorage (useWishlist)
 *   2. Hit /api/hotels/:id and /api/cars/:id to get fresh
 *      title + image + price (in case partner edited)
 *   3. Render as cards
 *
 * Empty-state copy invites the user to start browsing rather
 * than just saying "you have nothing saved".
 *
 * No backend persistence yet — when we add /api/user/wishlist,
 * this page picks it up automatically since the hook stays the
 * same shape.
 * ============================================================
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, MapPin, Star, Trash2, ArrowRight, Compass } from 'lucide-react'
import { formatCurrency } from '@chiangrai/shared/utils'
import useWishlist, { type WishlistEntry } from '@/hooks/useWishlist'
import { ListingGridSkeleton } from '@/components/shared/Skeletons'
import { useToast } from '@/components/shared/Toast'

interface ResolvedItem {
  kind: 'hotel' | 'car'
  id: string
  name: string
  image: string | null
  price: number
  rating?: number | null
  location?: string | null
  carType?: string | null
}

export default function WishlistPage() {
  const { items, remove, clear } = useWishlist()
  const toast = useToast()
  const [resolved, setResolved] = useState<ResolvedItem[] | null>(null)

  useEffect(() => {
    if (items.length === 0) {
      setResolved([])
      return
    }
    let cancelled = false
    void resolveAll(items).then((list) => {
      if (!cancelled) setResolved(list)
    })
    return () => {
      cancelled = true
    }
  }, [items])

  const handleClearAll = () => {
    if (window.confirm('ลบรายการที่บันทึกทั้งหมด?')) {
      clear()
      toast.success('ลบรายการที่บันทึกทั้งหมดแล้ว')
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6 sm:mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-2">
              <Heart className="text-rose-500 fill-rose-500" size={28} />
              รายการที่ชอบ
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ที่พักและรถที่คุณบันทึกไว้ — บันทึกในเครื่อง ไม่ต้องล็อกอิน
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 font-medium"
            >
              <Trash2 size={14} />
              ลบทั้งหมด
            </button>
          )}
        </div>

        {/* Loading */}
        {resolved === null && <ListingGridSkeleton count={6} />}

        {/* Empty */}
        {resolved !== null && resolved.length === 0 && (
          <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-white to-indigo-50 border border-rose-100 p-10 sm:p-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-md flex items-center justify-center mb-5">
              <Heart className="text-rose-400" size={28} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              ยังไม่มีรายการที่บันทึก
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              กดรูปหัวใจ ❤️ บนการ์ดที่พักหรือรถใดก็ได้เพื่อบันทึกไว้กลับมาดูทีหลัง
              — ไม่ต้องล็อกอิน
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
              >
                <Compass size={16} />
                ดูที่พัก
              </Link>
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:border-indigo-300"
              >
                ดูรถเช่า
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {/* Grid */}
        {resolved && resolved.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {resolved.map((item) => (
              <WishlistCard
                key={`${item.kind}-${item.id}`}
                item={item}
                onRemove={() => {
                  remove(item.kind, item.id)
                  toast.info('ลบจากรายการที่ชอบแล้ว')
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------

function WishlistCard({
  item,
  onRemove,
}: {
  item: ResolvedItem
  onRemove: () => void
}) {
  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden card-premium">
      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="ลบจากรายการที่ชอบ"
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:scale-110 transition-all"
      >
        <Trash2 size={14} />
      </button>

      <Link
        href={`/${item.kind}s/${item.id}`}
        className="block focus-ring rounded-2xl"
      >
        <div className="relative h-48 overflow-hidden bg-slate-100">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover img-zoom"
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          {item.rating != null && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-slate-900">{item.rating}</span>
            </div>
          )}
          {item.kind === 'car' && item.carType && (
            <div className="absolute top-3 left-3 bg-slate-900/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {item.carType}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <MapPin size={12} />
            <span className="truncate">
              {item.location || (item.kind === 'hotel' ? 'โรงแรม' : 'รถเช่า')}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1">
            {item.name}
          </h3>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400">เริ่มต้น</span>
            <span className="text-base font-black text-indigo-600">
              {formatCurrency(item.price)}
              <span className="text-xs font-normal text-slate-500 ml-1">
                / {item.kind === 'hotel' ? 'คืน' : 'วัน'}
              </span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------
// Resolve wishlist entries to display data via the public APIs.
// ---------------------------------------------------------------

async function resolveAll(entries: WishlistEntry[]): Promise<ResolvedItem[]> {
  const out = await Promise.all(entries.map(resolveOne))
  return out.filter((x): x is ResolvedItem => !!x)
}

async function resolveOne(
  entry: WishlistEntry
): Promise<ResolvedItem | null> {
  try {
    const path =
      entry.kind === 'hotel' ? `/api/hotels/${entry.id}` : `/api/cars/${entry.id}`
    const res = await fetch(path, { credentials: 'include' })
    if (!res.ok) return null
    const json = (await res.json()) as Record<string, unknown>
    const data = ((json as { data?: Record<string, unknown> }).data ||
      json) as Record<string, unknown>

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
      location:
        entry.kind === 'hotel'
          ? (data.location as string) ||
            (data.location_th as string) ||
            (data.location_en as string) ||
            null
          : null,
      carType:
        entry.kind === 'car'
          ? (data.car_type_th as string) ||
            (data.car_type_en as string) ||
            null
          : null,
    }
  } catch {
    return null
  }
}
