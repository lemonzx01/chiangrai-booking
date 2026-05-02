/**
 * ============================================================
 * LoyaltyCard — points balance + recent activity
 * ============================================================
 *
 * Renders on /profile next to the ReferralCard. Shows the
 * user's current point balance prominently, plus the last few
 * ledger entries so they can see "where these came from."
 *
 * Phase-1 scope:
 *   Counter only. No tier badge ("Bronze/Silver/Gold") yet —
 *   that lands in phase 2 once we have data on actual earning
 *   distributions to set sensible thresholds.
 *
 * Failure modes:
 *   401 → render nothing (page-level layout handles auth)
 *   500 → render an inline retry banner; doesn't block the
 *         rest of the profile page.
 * ============================================================
 */

'use client'

import { useEffect, useState } from 'react'
import { Star, Loader2, Calendar, Plus, Minus, Award } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface LoyaltyEntry {
  delta: number
  kind: 'earn' | 'redeem' | 'void' | 'adjust'
  reason: string | null
  createdAt: string
}

interface LoyaltyOverview {
  points: number
  recent: LoyaltyEntry[]
}

export default function LoyaltyCard() {
  const { i18n } = useTranslation()
  const lang = i18n.language as 'th' | 'en'

  const [data, setData] = useState<LoyaltyOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch('/api/user/loyalty', { credentials: 'include' })
        if (!res.ok) {
          // Stay quiet on 401 — the page redirects to login.
          if (res.status !== 401) setError(true)
          return
        }
        const json = (await res.json()) as LoyaltyOverview
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'th' ? 'แต้มสะสม' : 'Loyalty Points'}
          </h2>
        </div>
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Star className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'th' ? 'แต้มสะสม' : 'Loyalty Points'}
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          {lang === 'th'
            ? 'ไม่สามารถโหลดข้อมูลแต้มสะสมได้ในตอนนี้'
            : "Couldn't load your points right now."}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Star className="w-6 h-6 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900">
          {lang === 'th' ? 'แต้มสะสม' : 'Loyalty Points'}
        </h2>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        {lang === 'th'
          ? 'จองที่พัก/รถเช่า เพื่อสะสมแต้ม — รายละเอียดสิทธิประโยชน์เร็ว ๆ นี้'
          : 'Earn points on every booking — perks coming soon'}
      </p>

      {/* Hero number — the headline of the card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-700 mb-1">
              {lang === 'th' ? 'ยอดแต้มปัจจุบัน' : 'Current balance'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">
                {data.points.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-amber-700">
                {lang === 'th' ? 'แต้ม' : 'pts'}
              </span>
            </div>
          </div>
          <Award className="w-12 h-12 text-amber-400 opacity-60" />
        </div>
      </div>

      {/* Recent activity */}
      {data.recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500" />
            {lang === 'th' ? 'ประวัติล่าสุด' : 'Recent activity'}
          </div>
          <ul className="space-y-1.5">
            {data.recent.slice(0, 5).map((entry, i) => {
              const isEarn = entry.delta > 0
              return (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 pb-1.5 last:pb-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isEarn
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isEarn ? (
                        <Plus className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                    </span>
                    <span className="text-slate-700 truncate">
                      {entry.reason || labelKind(entry.kind, lang)}
                    </span>
                  </div>
                  <span
                    className={`font-semibold ml-2 flex-shrink-0 ${
                      isEarn ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    {isEarn ? '+' : ''}
                    {entry.delta.toLocaleString()}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {data.recent.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-4">
          {lang === 'th'
            ? 'ยังไม่มีรายการ — จองครั้งแรกเพื่อเริ่มสะสมแต้ม'
            : 'No activity yet — book to start earning'}
        </p>
      )}
    </div>
  )
}

function labelKind(
  kind: LoyaltyEntry['kind'],
  lang: 'th' | 'en'
): string {
  const map: Record<LoyaltyEntry['kind'], { th: string; en: string }> = {
    earn: { th: 'รับแต้ม', en: 'Earned' },
    redeem: { th: 'ใช้แต้ม', en: 'Redeemed' },
    void: { th: 'ยกเลิก', en: 'Voided' },
    adjust: { th: 'ปรับยอด', en: 'Adjusted' },
  }
  return map[kind][lang]
}
