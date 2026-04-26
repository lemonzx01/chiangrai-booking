/**
 * ============================================================
 * Skeleton patterns — pre-shaped loaders that match real UI
 * ============================================================
 *
 * Why pre-shaped loaders matter:
 *   A vague grey rectangle while data loads still feels janky;
 *   loaders that mirror the final layout reduce perceived
 *   loading time and prevent layout shift when real content
 *   slots in.
 *
 * The components here mirror the corresponding "real" cards
 * (HotelCard, CarCard, BookingCard, etc.) — keep them in sync
 * if you change the real layout.
 * ============================================================
 */

'use client'

import Skeleton from '@/components/ui/Skeleton'

/** Card skeleton matching HotelCard / CarCard footprint. */
export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-4 sm:p-5 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  )
}

/** A grid of N listing skeletons, used during initial fetch. */
export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Hero+content layout for hotel/car detail pages. */
export function DetailPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

/** Booking row skeleton (admin/partner tables). */
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

/** Carousel/list of small thumbnails (Recently Viewed, etc.) */
export function ThumbStripSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-44 space-y-2">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
