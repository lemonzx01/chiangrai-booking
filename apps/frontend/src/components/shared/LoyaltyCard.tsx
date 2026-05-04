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
import {
  Star,
  Loader2,
  Calendar,
  Plus,
  Minus,
  Award,
  Gift,
  Copy,
  CheckCircle2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'

interface LoyaltyEntry {
  delta: number
  kind: 'earn' | 'redeem' | 'void' | 'adjust'
  reason: string | null
  createdAt: string
}

interface RedeemTier {
  points: number
  valueThb: number
  label: string
}

interface LoyaltyOverview {
  points: number
  recent: LoyaltyEntry[]
  redeemTiers: RedeemTier[]
}

export default function LoyaltyCard() {
  const { i18n } = useTranslation()
  const lang = i18n.language as 'th' | 'en'
  const toast = useToast()

  const [data, setData] = useState<LoyaltyOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Redemption-flow state. We keep it inside the card so a
  // failed redemption doesn't stomp on the page-level state.
  const [redeemingTier, setRedeemingTier] = useState<number | null>(null)
  const [issued, setIssued] = useState<{
    couponCode: string
    valueThb: number
    expiresAt: string
  } | null>(null)
  const [copiedCoupon, setCopiedCoupon] = useState(false)

  async function redeem(tier: RedeemTier) {
    if (!data) return
    if (data.points < tier.points) {
      toast.error(
        lang === 'th' ? 'แต้มไม่พอสำหรับการแลก' : 'Not enough points'
      )
      return
    }
    setRedeemingTier(tier.points)
    try {
      const res = await apiFetch('/api/user/loyalty/redeem', {
        method: 'POST',
        body: { points: tier.points },
      })
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        couponCode?: string
        valueThb?: number
        expiresAt?: string
        pointsRemaining?: number
        error?: string
      }
      if (!res.ok || !body.ok || !body.couponCode) {
        toast.error(
          body.error ||
            (lang === 'th' ? 'แลกแต้มไม่สำเร็จ' : 'Redemption failed')
        )
        return
      }
      // Optimistic local update — replaces the card's points
      // counter with the post-deduction value the server
      // returned, and unshifts a fake ledger row so the user
      // sees their action reflected immediately. Next page
      // load will fetch the canonical state.
      setData((prev) =>
        prev
          ? {
              ...prev,
              points: body.pointsRemaining ?? prev.points - tier.points,
              recent: [
                {
                  delta: -tier.points,
                  kind: 'redeem' as const,
                  reason:
                    lang === 'th'
                      ? `แลกแต้มเป็นคูปอง (รหัส ${body.couponCode})`
                      : `Redeemed coupon (${body.couponCode})`,
                  createdAt: new Date().toISOString(),
                },
                ...prev.recent,
              ].slice(0, 10),
            }
          : prev
      )
      setIssued({
        couponCode: body.couponCode,
        valueThb: body.valueThb || tier.valueThb,
        expiresAt: body.expiresAt || new Date().toISOString(),
      })
      toast.success(
        lang === 'th' ? 'แลกแต้มสำเร็จ!' : 'Redemption successful!'
      )
    } catch {
      toast.error(
        lang === 'th' ? 'แลกแต้มไม่สำเร็จ' : 'Redemption failed'
      )
    } finally {
      setRedeemingTier(null)
    }
  }

  async function copyCoupon() {
    if (!issued) return
    try {
      await navigator.clipboard.writeText(issued.couponCode)
      setCopiedCoupon(true)
      toast.success(lang === 'th' ? 'คัดลอกแล้ว' : 'Copied!')
      setTimeout(() => setCopiedCoupon(false), 2000)
    } catch {
      // best-effort
    }
  }

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
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-700 mb-1">
              {lang === 'th' ? 'ยอดแต้มปัจจุบัน' : 'Current balance'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold text-slate-900">
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

      {/* Just-issued coupon — shown after a successful redeem.
          Stays until next page load or until the user dismisses
          via the copy interaction. */}
      {issued && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900 mb-1">
                {lang === 'th'
                  ? `แลกแต้มสำเร็จ — รับคูปอง ฿${issued.valueThb}`
                  : `Redeemed — ฿${issued.valueThb} coupon issued`}
              </p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm font-bold text-slate-900 bg-white px-2 py-1 rounded border border-emerald-200">
                  {issued.couponCode}
                </code>
                <button
                  onClick={copyCoupon}
                  className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                  aria-label={lang === 'th' ? 'คัดลอกรหัสคูปอง' : 'Copy coupon code'}
                >
                  {copiedCoupon ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                {lang === 'th'
                  ? 'ใช้กับการจองครั้งถัดไป — คูปองนี้ผูกกับอีเมลของคุณ'
                  : 'Apply at your next checkout — this coupon is bound to your email'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Redemption tiers — always visible, disabled when balance
          is below cost so the UI is never a surprise. */}
      {data.redeemTiers && data.redeemTiers.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
            <Gift className="w-4 h-4 text-slate-500" />
            {lang === 'th' ? 'แลกเป็นคูปอง' : 'Redeem for a coupon'}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {data.redeemTiers.map((tier) => {
              const enough = data.points >= tier.points
              const busy = redeemingTier === tier.points
              return (
                <button
                  key={tier.points}
                  onClick={() => redeem(tier)}
                  disabled={!enough || busy}
                  className={`p-3 rounded-xl border text-center transition-colors ${
                    enough
                      ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 active:bg-amber-200'
                      : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`text-base font-bold ${enough ? 'text-slate-900' : 'text-slate-500'}`}>
                    ฿{tier.valueThb}
                  </div>
                  <div className={`text-xs mt-0.5 ${enough ? 'text-amber-700' : 'text-slate-400'}`}>
                    {busy ? (
                      <Loader2 className="w-3 h-3 animate-spin inline" />
                    ) : (
                      `${tier.points} ${lang === 'th' ? 'แต้ม' : 'pts'}`
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

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
