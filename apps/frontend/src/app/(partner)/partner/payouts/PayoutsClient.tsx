/**
 * ============================================================
 * Partner Payouts (Stripe Connect) — client component
 * ============================================================
 *
 * Three states the partner can be in:
 *
 *   1. NOT_STARTED — no stripe_account_id yet. CTA button posts
 *      to the existing endpoint, which creates the Connect
 *      account on demand and returns an onboarding URL we
 *      open in a new tab.
 *
 *   2. PENDING — stripe_account_id set but Stripe says the
 *      account isn't fully onboarded (charges_enabled=false
 *      or details_submitted=false). Show what's missing and
 *      a "ทำต่อ" button that creates a fresh account link
 *      (Stripe links expire after a few hours).
 *
 *   3. ACTIVE — fully onboarded. Show a green confirmation
 *      and the (truncated) account id.
 *
 * The status check happens on mount and after the user returns
 * from Stripe (window focus event), so the UI catches up
 * automatically without a manual refresh.
 * ============================================================
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, ExternalLink, Loader2, ShieldCheck, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'

export interface PartnerProfile {
  id: string
  email: string
  name: string
  stripe_account_id: string | null
  onboarding_status: string | null
}

interface StripeStatus {
  isOnboarded: boolean
  detailsSubmitted: boolean
  chargesEnabled: boolean
}

type ViewState =
  | { kind: 'not_started' }
  | { kind: 'loading' }
  | { kind: 'pending'; status: StripeStatus }
  | { kind: 'active'; status: StripeStatus }
  | { kind: 'error'; message: string }

export default function PayoutsClient({ partner }: { partner: PartnerProfile }) {
  const toast = useToast()
  const [view, setView] = useState<ViewState>(
    partner.stripe_account_id ? { kind: 'loading' } : { kind: 'not_started' }
  )
  const [busy, setBusy] = useState(false)

  // Poll once on mount, plus whenever the tab regains focus (catches
  // the case where the user finished onboarding in another tab).
  const refresh = useCallback(async () => {
    if (!partner.stripe_account_id) return
    try {
      const res = await apiFetch(`/api/partners/${partner.id}/stripe-status`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setView({ kind: 'error', message: data.error || 'ตรวจสอบสถานะไม่สำเร็จ' })
        return
      }
      const status = (await res.json()) as StripeStatus
      setView({ kind: status.isOnboarded ? 'active' : 'pending', status })
    } catch {
      setView({ kind: 'error', message: 'เครือข่ายมีปัญหา ลองใหม่อีกครั้ง' })
    }
  }, [partner.id, partner.stripe_account_id])

  useEffect(() => {
    if (partner.stripe_account_id) void refresh()
    const onFocus = () => {
      if (partner.stripe_account_id) void refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [partner.stripe_account_id, refresh])

  const startOnboarding = async () => {
    setBusy(true)
    try {
      const res = await apiFetch(`/api/partners/${partner.id}/connect-stripe`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        toast.error(data?.error || 'ไม่สามารถเริ่ม onboarding ได้')
        return
      }
      // Open in new tab so the partner doesn't lose context.
      window.open(data.url as string, '_blank', 'noopener')
      toast.info('เปิดหน้า Stripe ในแท็บใหม่ — กรอกข้อมูลแล้วกลับมาที่นี่')
      // Stripe just gave us an account; flip to loading so the
      // status check fires when the user returns.
      setView({ kind: 'loading' })
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <StatusCard view={view} />

      {/* Action panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
        {view.kind === 'not_started' && (
          <ActionRow
            title="เริ่มเชื่อมบัญชี Stripe"
            body="พาร์ทเนอร์ทุกรายต้องผ่าน Stripe Connect เพื่อรับเงินจากการจอง — ใช้เวลา ~5 นาที กรอกข้อมูลธุรกิจ + บัญชีรับเงิน"
            cta="เริ่มเลย"
            onClick={startOnboarding}
            busy={busy}
          />
        )}
        {view.kind === 'pending' && (
          <ActionRow
            title="ทำต่อให้เสร็จ"
            body={describePending(view.status)}
            cta="กลับไปกรอกข้อมูล"
            onClick={startOnboarding}
            busy={busy}
            secondary
          />
        )}
        {view.kind === 'active' && (
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-slate-900">เชื่อมเรียบร้อยแล้ว</p>
              <p className="text-sm text-slate-600 mt-0.5">
                เงินจากการจองจะโอนเข้าบัญชีของคุณตามรอบที่ตั้งไว้ใน Stripe
              </p>
              {partner.stripe_account_id && (
                <p className="text-[11px] text-slate-400 font-mono mt-2">
                  Account: {truncate(partner.stripe_account_id)}
                </p>
              )}
            </div>
          </div>
        )}
        {view.kind === 'error' && (
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-slate-900">ตรวจสอบสถานะไม่สำเร็จ</p>
              <p className="text-sm text-slate-600 mt-0.5">{view.message}</p>
              <button
                type="button"
                onClick={() => {
                  setView({ kind: 'loading' })
                  void refresh()
                }}
                className="mt-3 text-sm font-semibold text-slate-900 hover:underline"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        )}
        {view.kind === 'loading' && (
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">กำลังตรวจสอบสถานะกับ Stripe...</span>
          </div>
        )}
      </div>

      {/* FAQ / help block */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 sm:p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3">คำถามที่พบบ่อย</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>
            <span className="font-semibold text-slate-700">ต้องเตรียมอะไรบ้าง?</span>{' '}
            บัตรประชาชน (หรือ passport), ข้อมูลธุรกิจ, เลขบัญชีรับเงิน
          </li>
          <li>
            <span className="font-semibold text-slate-700">เงินจะเข้าบัญชีเมื่อไหร่?</span>{' '}
            ตามรอบที่ Stripe ตั้งให้ (เริ่มต้นทุก 7 วันสำหรับบัญชีใหม่)
          </li>
          <li>
            <span className="font-semibold text-slate-700">ค่าธรรมเนียม?</span>{' '}
            Stripe คิด 3.65% + 10 บาท/รายการสำหรับบัตรไทย
          </li>
        </ul>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------

function StatusCard({ view }: { view: ViewState }) {
  const cfg = (() => {
    switch (view.kind) {
      case 'not_started':
        return {
          icon: <Clock size={20} className="text-slate-400" />,
          bg: 'bg-slate-50 border-slate-200',
          label: 'ยังไม่เริ่ม',
          desc: 'คุณยังไม่ได้เชื่อม Stripe Connect',
        }
      case 'loading':
        return {
          icon: <Loader2 size={20} className="animate-spin text-slate-700" />,
          bg: 'bg-slate-50 border-slate-200',
          label: 'กำลังตรวจสอบ',
          desc: 'รอผลจาก Stripe...',
        }
      case 'pending':
        return {
          icon: <AlertCircle size={20} className="text-amber-500" />,
          bg: 'bg-amber-50 border-amber-100',
          label: 'รอข้อมูลเพิ่มเติม',
          desc: describePending(view.status),
        }
      case 'active':
        return {
          icon: <ShieldCheck size={20} className="text-emerald-500" />,
          bg: 'bg-emerald-50 border-emerald-100',
          label: 'พร้อมรับเงิน',
          desc: 'บัญชีของคุณผ่านการตรวจสอบและพร้อมรับเงินจากการจองแล้ว',
        }
      case 'error':
        return {
          icon: <AlertCircle size={20} className="text-red-500" />,
          bg: 'bg-red-50 border-red-100',
          label: 'เกิดข้อผิดพลาด',
          desc: view.message,
        }
    }
  })()

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">{cfg.label}</p>
          <p className="text-sm text-slate-600 mt-0.5">{cfg.desc}</p>
        </div>
      </div>
    </div>
  )
}

function ActionRow({
  title,
  body,
  cta,
  onClick,
  busy,
  secondary = false,
}: {
  title: string
  body: string
  cta: string
  onClick: () => void
  busy: boolean
  secondary?: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600 mt-0.5">{body}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${
          secondary
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'bg-slate-900 hover:bg-slate-800 text-white'
        }`}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
        {cta}
      </button>
    </div>
  )
}

function describePending(s: StripeStatus): string {
  if (!s.detailsSubmitted) {
    return 'ยังไม่ได้กรอกข้อมูลครบ — กลับเข้าไปที่ Stripe เพื่อกรอกต่อให้เสร็จ'
  }
  if (!s.chargesEnabled) {
    return 'Stripe กำลังตรวจสอบเอกสาร อาจใช้เวลา 1–3 วันทำการ'
  }
  return 'รอ Stripe ยืนยัน...'
}

function truncate(id: string): string {
  if (id.length <= 14) return id
  return `${id.slice(0, 6)}…${id.slice(-4)}`
}
