/**
 * ============================================================
 * TrustSignals — small badge row for detail / checkout pages
 * ============================================================
 *
 * Why these signals matter:
 *   Bookings are a high-trust transaction (a stranger holds
 *   your money for weeks before delivering anything). Visible
 *   reassurance on the detail and checkout pages reduces drop
 *   off — multiple studies put the lift at 5–15%.
 *
 * Variants:
 *   - "compact": single horizontal row of small badges (used
 *     under the booking form CTA)
 *   - "grid": 4-up card layout (used on detail pages, longer
 *     copy per badge)
 *
 * The badges themselves are bilingual and use lucide icons so
 * we don't need extra image assets.
 * ============================================================
 */

'use client'

import { ShieldCheck, Lock, Headphones, BadgeCheck } from 'lucide-react'

interface TrustSignalsProps {
  variant?: 'compact' | 'grid'
}

const items = [
  {
    icon: Lock,
    titleTh: 'ชำระเงินปลอดภัย',
    titleEn: 'Secure payment',
    descTh: 'เข้ารหัส SSL ผ่าน Stripe',
    descEn: 'SSL encrypted via Stripe',
  },
  {
    icon: BadgeCheck,
    titleTh: 'ที่พักผ่านการคัดเลือก',
    titleEn: 'Verified listings',
    descTh: 'เราไปดูเองทุกที่ก่อนขึ้นเว็บ',
    descEn: 'Hand-picked by our team',
  },
  {
    icon: ShieldCheck,
    titleTh: 'รับประกันคืนเงิน',
    titleEn: 'Money-back guarantee',
    descTh: 'ยกเลิกฟรีก่อน 7 วัน',
    descEn: 'Free cancel up to 7 days',
  },
  {
    icon: Headphones,
    titleTh: 'ช่วยเหลือ 24/7',
    titleEn: '24/7 support',
    descTh: 'ทักทาง LINE / โทร',
    descEn: 'Reach us via LINE / phone',
  },
]

export default function TrustSignals({ variant = 'compact' }: TrustSignalsProps) {
  if (variant === 'compact') {
    return (
      <div
        role="list"
        aria-label="ความมั่นใจในการจอง"
        className="flex flex-wrap gap-2 sm:gap-3"
      >
        {items.map(({ icon: Icon, titleTh }) => (
          <div
            key={titleTh}
            role="listitem"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold"
          >
            <Icon size={14} className="flex-shrink-0" />
            <span>{titleTh}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      role="list"
      aria-label="ทำไมต้องจองกับเรา"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {items.map(({ icon: Icon, titleTh, titleEn, descTh, descEn }) => (
        <div
          key={titleTh}
          role="listitem"
          className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 hover:border-indigo-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
            <Icon size={20} className="text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">{titleTh}</div>
          <div className="text-[11px] text-slate-400 mb-1.5 italic">{titleEn}</div>
          <div className="text-xs text-slate-600 leading-relaxed">{descTh}</div>
          <div className="text-[10px] text-slate-400 mt-1 italic">{descEn}</div>
        </div>
      ))}
    </div>
  )
}
