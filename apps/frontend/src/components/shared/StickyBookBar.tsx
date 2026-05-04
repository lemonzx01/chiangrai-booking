/**
 * ============================================================
 * StickyBookBar — bottom-of-screen sticky CTA on detail pages
 * ============================================================
 *
 * Sits below the page content on mobile (where users won't see
 * the book button at the top of the page after scrolling) and
 * floats over the content on desktop. Shows the price + a CTA
 * button that scrolls to the booking form (or triggers a
 * provided callback).
 *
 * Why two visibility modes:
 *   - Mobile: ALWAYS visible — the price stays in front of the
 *     user as they read.
 *   - Desktop: only show after the user has scrolled past 600px,
 *     so it doesn't fight with the in-page book form.
 * ============================================================
 */

'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { formatCurrency } from '@chiangrai/shared/utils'

interface StickyBookBarProps {
  price: number
  /** "/ คืน", "/ วัน" etc. */
  unit?: string
  /** Strike-through original price for "discount" display. */
  originalPrice?: number
  /** Click handler — typically scrolls to a #book section. */
  onBookClick: () => void
  /** Button label (default "จองเลย"). */
  ctaLabel?: string
  /** Extra content under the price line (e.g. "เหลือ 2 ห้อง"). */
  hint?: ReactNode
  /** Show on desktop after scrolling past this many pixels. Default 600. */
  desktopRevealAfter?: number
}

export default function StickyBookBar({
  price,
  unit = '/ คืน',
  originalPrice,
  onBookClick,
  ctaLabel = 'จองเลย',
  hint,
  desktopRevealAfter = 600,
}: StickyBookBarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > desktopRevealAfter)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [desktopRevealAfter])

  return (
    <>
      {/* Mobile: always visible, pinned to bottom */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              <span className="text-lg font-semibold text-slate-900">
                {formatCurrency(price)}
              </span>
              <span className="text-xs text-slate-500">{unit}</span>
            </div>
            {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
          </div>
          <button
            type="button"
            onClick={onBookClick}
            className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 active:scale-95 transition-transform shadow-md"
          >
            {ctaLabel}
          </button>
        </div>
        {/* iPhone safe-area padding */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

      {/* Desktop: floating, reveals after scroll */}
      <div
        aria-hidden={!scrolled}
        className={`hidden md:block fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          scrolled
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 pl-5">
          <div className="text-right">
            {originalPrice && originalPrice > price && (
              <span className="block text-xs text-slate-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
            <span className="text-xl font-semibold text-slate-900">{formatCurrency(price)}</span>
            <span className="text-xs text-slate-500 ml-1">{unit}</span>
          </div>
          <button
            type="button"
            onClick={onBookClick}
            className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-md"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </>
  )
}
