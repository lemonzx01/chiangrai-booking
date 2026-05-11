'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Calendar, Sparkles, Heart, ArrowRight } from 'lucide-react'

interface ProfileSummaryProps {
  activeBookings: number
  /**
   * Gate the wishlist + loyalty fetches on parent's auth state.
   * The parent (profile/page.tsx) already redirects to /login on
   * a 401 from /api/user/profile; firing these calls before that
   * resolves logs spurious 401s in the console. Default true to
   * keep callers backward-compatible.
   */
  enabled?: boolean
}

const TIERS = [
  { level: 'bronze', name: 'Bronze', min: 0, multiplier: 1.0 },
  { level: 'silver', name: 'Silver', min: 500, multiplier: 1.25 },
  { level: 'gold', name: 'Gold', min: 2000, multiplier: 1.5 },
] as const

function tierFromLifetime(lifetime: number) {
  if (lifetime >= TIERS[2].min) return TIERS[2]
  if (lifetime >= TIERS[1].min) return TIERS[1]
  return TIERS[0]
}

export default function ProfileSummary({ activeBookings, enabled = true }: ProfileSummaryProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const [wishlistCount, setWishlistCount] = useState<number | null>(null)
  const [loyalty, setLoyalty] = useState<{ points: number; lifetime: number } | null>(null)

  useEffect(() => {
    if (!enabled) return
    let alive = true

    fetch('/api/user/wishlist')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => {
        if (alive) setWishlistCount(Array.isArray(d.data) ? d.data.length : 0)
      })
      .catch(() => {
        if (alive) setWishlistCount(0)
      })

    fetch('/api/user/loyalty')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return
        setLoyalty({
          points: typeof d.points === 'number' ? d.points : 0,
          lifetime:
            typeof d.lifetimeEarned === 'number'
              ? d.lifetimeEarned
              : (d?.tier?.lifetimeEarned ?? 0),
        })
      })
      .catch(() => {
        if (alive) setLoyalty({ points: 0, lifetime: 0 })
      })

    return () => {
      alive = false
    }
  }, [enabled])

  const points = loyalty?.points ?? 0
  const tier = tierFromLifetime(loyalty?.lifetime ?? 0)

  type Card = {
    key: string
    icon: typeof Calendar
    label: string
    value: string
    hint: string
    href: string
    isAnchor: boolean
  }

  const cards: Card[] = [
    {
      key: 'bookings',
      icon: Calendar,
      label: lang === 'th' ? 'การจองที่กำลังใช้งาน' : 'Active bookings',
      value: activeBookings.toString(),
      hint:
        activeBookings > 0
          ? lang === 'th'
            ? 'ดูรายละเอียดด้านล่าง'
            : 'View details below'
          : lang === 'th'
            ? 'ยังไม่มีการจอง'
            : 'No bookings yet',
      href: '#bookings',
      isAnchor: true,
    },
    {
      key: 'loyalty',
      icon: Sparkles,
      label: lang === 'th' ? 'แต้มสะสม' : 'Loyalty points',
      value: loyalty === null ? '—' : points.toLocaleString(),
      // Multipliers are 1, 1.25, 1.5 — `${n}×` reads cleaner than
      // `1.00×` and still shows fractional tiers honestly.
      hint:
        lang === 'th'
          ? `${tier.name} · ×${tier.multiplier}`
          : `${tier.name} · ${tier.multiplier}× earn`,
      href: '#loyalty',
      isAnchor: true,
    },
    {
      key: 'wishlist',
      icon: Heart,
      label: lang === 'th' ? 'รายการที่ชอบ' : 'Wishlist',
      value: wishlistCount === null ? '—' : wishlistCount.toString(),
      hint: lang === 'th' ? 'ดูรายการทั้งหมด' : 'View all saved',
      href: '/wishlist',
      isAnchor: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {cards.map(({ key, icon: Icon, label, value, hint, href, isAnchor }) => {
        const className =
          'group bg-white rounded-2xl border border-slate-200 p-5 transition-colors hover:border-slate-300 block'
        const inner = (
          <>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Icon size={18} className="text-slate-700" strokeWidth={1.75} />
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1"
              />
            </div>
            <div className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">
              {label}
            </div>
            <div className="text-2xl font-display tracking-tight text-slate-900 mb-1">
              {value}
            </div>
            <div className="text-xs text-slate-500">{hint}</div>
          </>
        )

        if (isAnchor) {
          return (
            <a key={key} href={href} className={className}>
              {inner}
            </a>
          )
        }
        return (
          <Link key={key} href={href} className={className}>
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
