/**
 * ============================================================
 * LoyaltyPointsPreview — "+N แต้ม" badge near a price
 * ============================================================
 *
 * Tiny presentation component used on hotel / car detail pages
 * to show how many loyalty points the listing's price would
 * earn at the default rate. Renders nothing when the points
 * value would round to 0 (avoids "+0 pts" noise on cheap items).
 *
 * Why client component despite having no state:
 *   We use the i18n hook to switch between Thai and English
 *   labels. The component is otherwise pure — just a styled
 *   span around a number.
 *
 * Why not a server component:
 *   The detail pages already mix server (page.tsx) and client
 *   (Detail*Client.tsx). The pricing display lives in the
 *   client component, so this lives there too.
 * ============================================================
 */

'use client'

import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { pointsForAmountAtDefaultRate } from '@chiangrai/shared/constants'

interface LoyaltyPointsPreviewProps {
  /** The price in THB used to compute earned points. */
  amountThb: number
  /** Visual size — `sm` for inline near a per-night price,
   *  `md` for stickers next to the main CTA. */
  size?: 'sm' | 'md'
  /** Optional className passed through for layout overrides. */
  className?: string
}

export default function LoyaltyPointsPreview({
  amountThb,
  size = 'sm',
  className = '',
}: LoyaltyPointsPreviewProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language as 'th' | 'en'

  const points = pointsForAmountAtDefaultRate(amountThb)
  if (points <= 0) return null

  const sizeStyles =
    size === 'md'
      ? 'text-sm px-3 py-1 gap-1.5'
      : 'text-xs px-2 py-0.5 gap-1'

  return (
    <span
      className={`inline-flex items-center rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold ${sizeStyles} ${className}`}
      // Title is the long-form description for hover; the badge
      // text itself stays compact.
      title={
        lang === 'th'
          ? `จองที่ราคานี้ จะได้รับ ${points} แต้มสะสม`
          : `Earn ${points} loyalty points at this price`
      }
    >
      <Star className={size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />
      {lang === 'th'
        ? `+${points.toLocaleString()} แต้ม`
        : `+${points.toLocaleString()} pts`}
    </span>
  )
}
