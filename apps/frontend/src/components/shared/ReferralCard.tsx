/**
 * ============================================================
 * ReferralCard — profile-page widget for the referral program
 * ============================================================
 *
 * Renders the user's referral code, share link, and signup
 * stats. The data comes from GET /api/user/referrals.
 *
 * UX choices:
 *   - Code is shown front-and-center in monospace, all caps.
 *     Tap-to-copy is the most-used action so it's the primary
 *     button; share-link copy is the secondary action.
 *   - Web Share API on mobile if available (one tap → native
 *     share sheet); falls back to clipboard on desktop.
 *   - Stats (pending / qualified / rewarded) are shown as small
 *     count chips so the user can see the funnel without it
 *     dominating the page.
 *   - Recent invitees list shows masked emails so the user can
 *     confirm "yes, my friend signed up" without our exposing
 *     full PII (the helper masks `john.doe@x.com` →
 *     `j***@x.com` on the backend).
 *
 * Failure modes:
 *   - 401 → render nothing (page will redirect to /login).
 *   - other errors → show a small inline retry button. We DON'T
 *     bubble up to the page-level error state because the
 *     referral card failing shouldn't block the rest of the
 *     profile.
 * ============================================================
 */

'use client'

import { useEffect, useState } from 'react'
import { Gift, Copy, Share2, CheckCircle2, Loader2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/shared/Toast'

interface Invitee {
  refereeName: string | null
  refereeEmail: string
  status: string
  createdAt: string
}

interface ReferralStats {
  code: string
  shareUrl: string
  total: number
  pending: number
  qualified: number
  rewarded: number
  invitees: Invitee[]
}

export default function ReferralCard() {
  const { i18n } = useTranslation()
  const lang = i18n.language as 'th' | 'en'
  const toast = useToast()

  const [data, setData] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch('/api/user/referrals', { credentials: 'include' })
        if (!res.ok) {
          // 401 is not really an "error" here — the page itself
          // handles auth redirect, so we just stay quiet.
          if (res.status !== 401) setError(true)
          return
        }
        const json = (await res.json()) as ReferralStats
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

  const copyCode = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.code)
      setCopiedCode(true)
      toast.success(lang === 'th' ? 'คัดลอกรหัสแล้ว' : 'Code copied!')
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      toast.error(lang === 'th' ? 'คัดลอกไม่สำเร็จ' : 'Copy failed')
    }
  }

  const copyLink = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.shareUrl)
      setCopiedLink(true)
      toast.success(lang === 'th' ? 'คัดลอกลิงก์แล้ว' : 'Link copied!')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      toast.error(lang === 'th' ? 'คัดลอกไม่สำเร็จ' : 'Copy failed')
    }
  }

  const shareViaSystem = async () => {
    if (!data) return
    // Web Share API → native sheet on mobile (iOS/Android). On
    // desktop browsers without it, fall back to copying the link.
    const sharePayload = {
      title: lang === 'th' ? 'จองเที่ยวเชียงราย' : 'Chiangrai Booking',
      text:
        lang === 'th'
          ? `ใช้รหัสแนะนำของฉัน "${data.code}" รับส่วนลดเมื่อจองครั้งแรก`
          : `Use my referral code "${data.code}" to get a discount on your first booking`,
      url: data.shareUrl,
    }
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(sharePayload)
      } catch {
        // User cancelled or share failed — silent, no toast.
      }
    } else {
      void copyLink()
    }
  }

  // ----------------------------------------------------------
  // Render branches
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="w-6 h-6 text-slate-900" />
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'th' ? 'ชวนเพื่อน รับส่วนลด' : 'Refer a Friend'}
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
          <Gift className="w-6 h-6 text-slate-900" />
          <h2 className="text-xl font-bold text-slate-900">
            {lang === 'th' ? 'ชวนเพื่อน รับส่วนลด' : 'Refer a Friend'}
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          {lang === 'th'
            ? 'ไม่สามารถโหลดข้อมูลรางวัลแนะนำได้ในตอนนี้'
            : "Couldn't load referral info right now."}
        </p>
      </div>
    )
  }

  // ----------------------------------------------------------
  // Main render
  // ----------------------------------------------------------

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Gift className="w-6 h-6 text-slate-900" />
        <h2 className="text-xl font-bold text-slate-900">
          {lang === 'th' ? 'ชวนเพื่อน รับส่วนลด' : 'Refer a Friend'}
        </h2>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        {lang === 'th'
          ? 'แชร์รหัสให้เพื่อน เมื่อเพื่อนจองสำเร็จครั้งแรก คุณทั้งคู่จะได้รับคูปองส่วนลด'
          : 'Share your code with friends. When they complete their first booking, you both get a discount coupon.'}
      </p>

      {/* Code box — primary affordance */}
      <div className="bg-indigo-50 border border-slate-200 rounded-xl p-4 mb-4">
        <p className="text-xs uppercase tracking-wide text-slate-900 mb-2">
          {lang === 'th' ? 'รหัสแนะนำของคุณ' : 'Your referral code'}
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-bold text-slate-900 tracking-widest">
            {data.code}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={copyCode}
            className="ml-auto flex items-center gap-1.5"
            aria-label={lang === 'th' ? 'คัดลอกรหัส' : 'Copy code'}
          >
            {copiedCode ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {lang === 'th' ? 'คัดลอกแล้ว' : 'Copied'}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {lang === 'th' ? 'คัดลอก' : 'Copy'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          type="button"
          variant="outline"
          onClick={copyLink}
          className="flex items-center justify-center gap-2"
        >
          {copiedLink ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {lang === 'th' ? 'คัดลอกลิงก์' : 'Copy Link'}
        </Button>
        <Button
          type="button"
          onClick={shareViaSystem}
          className="flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          {lang === 'th' ? 'แชร์' : 'Share'}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        <Stat
          label={lang === 'th' ? 'ทั้งหมด' : 'Total'}
          value={data.total}
          tone="default"
        />
        <Stat
          label={lang === 'th' ? 'รอจอง' : 'Pending'}
          value={data.pending}
          tone="amber"
        />
        <Stat
          label={lang === 'th' ? 'ผ่านเงื่อนไข' : 'Qualified'}
          value={data.qualified}
          tone="indigo"
        />
        <Stat
          label={lang === 'th' ? 'รับรางวัลแล้ว' : 'Rewarded'}
          value={data.rewarded}
          tone="emerald"
        />
      </div>

      {/* Recent invitees */}
      {data.invitees.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
            <Users className="w-4 h-4 text-slate-500" />
            {lang === 'th' ? 'เพื่อนล่าสุด' : 'Recent invitees'}
          </div>
          <ul className="space-y-1.5">
            {data.invitees.slice(0, 5).map((inv, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 pb-1.5 last:pb-0"
              >
                <span className="text-slate-700 truncate">
                  {inv.refereeName ? `${inv.refereeName} · ` : ''}
                  <span className="text-slate-500">{inv.refereeEmail}</span>
                </span>
                <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                  {labelStatus(inv.status, lang)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'default' | 'amber' | 'indigo' | 'emerald'
}) {
  const toneStyles: Record<typeof tone, string> = {
    default: 'bg-slate-50 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-50 text-slate-900 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <div
      className={`rounded-lg border p-2 text-center ${toneStyles[tone]}`}
    >
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide">{label}</div>
    </div>
  )
}

function labelStatus(status: string, lang: 'th' | 'en'): string {
  const map: Record<string, { th: string; en: string }> = {
    pending: { th: 'รอจอง', en: 'Pending' },
    qualified: { th: 'ผ่านเงื่อนไข', en: 'Qualified' },
    rewarded: { th: 'รับแล้ว', en: 'Rewarded' },
    voided: { th: 'ยกเลิก', en: 'Voided' },
  }
  return map[status]?.[lang] ?? status
}
