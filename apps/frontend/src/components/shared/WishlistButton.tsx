/**
 * ============================================================
 * WishlistButton — heart toggle for hotel + car cards/details
 * ============================================================
 *
 * Two visual variants:
 *   - 'pill' (default): rounded button with heart icon. Sits
 *     on the top-right corner of cards (absolute-positioned
 *     by the parent card).
 *   - 'inline': matches the button row style on detail pages,
 *     sits next to "จองเลย" CTA.
 *
 * Behavior:
 *   - Toggles localStorage entry via useWishlist
 *   - aria-pressed reflects current state for screen readers
 *   - Optimistic — flips visual state immediately, no spinner.
 *     Storage write is synchronous so there's no async work
 *     to await anyway.
 *   - Click stops propagation so a wrapping <Link> on cards
 *     doesn't navigate when the user actually wants to favorite.
 * ============================================================
 */

'use client'

import { Heart } from 'lucide-react'
import useWishlist, { type WishKind } from '@/hooks/useWishlist'

interface WishlistButtonProps {
  kind: WishKind
  id: string
  variant?: 'pill' | 'inline'
  /** Visible label next to the icon (only for inline variant). */
  showLabel?: boolean
}

export default function WishlistButton({
  kind,
  id,
  variant = 'pill',
  showLabel = false,
}: WishlistButtonProps) {
  const { has, toggle } = useWishlist()
  const saved = has(kind, id)

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(kind, id)
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? 'ลบจากรายการที่ชอบ' : 'บันทึกในรายการที่ชอบ'}
        className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full backdrop-blur-sm shadow-md flex items-center justify-center transition-all hover:scale-110 ${
          saved
            ? 'bg-rose-500 text-white'
            : 'bg-white/90 text-slate-600 hover:text-rose-500'
        }`}
      >
        <Heart
          size={16}
          className={saved ? 'fill-current' : ''}
          strokeWidth={saved ? 0 : 2}
        />
      </button>
    )
  }

  // inline variant
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'ลบจากรายการที่ชอบ' : 'บันทึกในรายการที่ชอบ'}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
        saved
          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
          : 'bg-white border-slate-200 text-slate-700 hover:border-rose-200 hover:text-rose-600'
      }`}
    >
      <Heart
        size={16}
        className={saved ? 'fill-current' : ''}
        strokeWidth={saved ? 0 : 2}
      />
      {showLabel && (saved ? 'บันทึกแล้ว' : 'บันทึก')}
    </button>
  )
}
