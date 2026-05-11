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

/**
 * Skeleton matching the /profile page structure: avatar header,
 * 3 summary cards, profile form, and a stub bookings list. Used
 * during initial load and during the brief 401-redirect window
 * before navigation completes.
 */
export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-px w-12" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 sm:px-8 mt-8 space-y-6">
        {/* Avatar + name card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4">
          <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        {/* 3 summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        {/* Personal info form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Bookings list */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <Skeleton className="h-5 w-40" />
          {[0, 1].map((i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for the /bookings/[code] detail page — stand-in for
 * the booking summary card + price breakdown layout.
 */
export function BookingDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
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
