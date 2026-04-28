/**
 * ============================================================
 * Admin Campaigns — composer + history (client)
 * ============================================================
 *
 * Two panes:
 *   1. Composer (left, 60%): subject, preheader, cohort,
 *      body (Markdown-lite), optional CTA, dry-run toggle
 *   2. History (right, 40%): past campaigns list with status
 *      pill, recipient count, sent date
 *
 * Markdown-lite cheatsheet shown next to the textarea. The
 * backend converts to safe HTML — admins can't inject scripts
 * even by trying.
 *
 * Dry-run is on by default for the first preview, so admins
 * always see "we'd send to N people" before pulling the trigger.
 * ============================================================
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Mail,
  Users,
  Clock,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'
import { useConfirm } from '@/components/shared/ConfirmDialog'

export interface CampaignRow {
  id: string
  subject: string
  cohort: string
  cohort_filters: Record<string, unknown> | null
  status: 'sending' | 'sent' | 'failed' | 'partial'
  recipient_count: number
  succeeded_count: number
  failed_count: number
  created_by_email: string | null
  created_at: string
  completed_at: string | null
}

const COHORT_OPTIONS: Array<{
  value: string
  label: string
  desc: string
}> = [
  {
    value: 'all_customers',
    label: 'ลูกค้าทั้งหมด',
    desc: 'ทุกอีเมลที่เคยจองในระบบ (max 1,000)',
  },
  {
    value: 'past_bookers',
    label: 'ลูกค้าที่จ่ายแล้ว',
    desc: 'มี booking สถานะ PAID หรือ COMPLETED',
  },
  {
    value: 'recent_bookers',
    label: 'ลูกค้าใหม่ (N วัน)',
    desc: 'จองภายใน N วันที่ผ่านมา (default 30)',
  },
  {
    value: 'cancelled',
    label: 'ลูกค้าที่ยกเลิก (Win-back)',
    desc: 'มี booking สถานะ CANCELLED',
  },
  {
    value: 'custom_emails',
    label: 'รายชื่ออีเมลเฉพาะ',
    desc: 'ใส่อีเมลเอง (คั่นด้วย newline หรือ comma)',
  },
]

export default function CampaignsClient({
  initialCampaigns,
}: {
  initialCampaigns: CampaignRow[]
}) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()

  const [campaigns, setCampaigns] = useState(initialCampaigns)

  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [body, setBody] = useState(
    'สวัสดี {{name}},\n\nเรามีโปรโมชันใหม่...'
  )
  const [cohort, setCohort] = useState('past_bookers')
  const [recentDays, setRecentDays] = useState(30)
  const [customEmails, setCustomEmails] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')

  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewResult, setPreviewResult] = useState<{
    count: number
    samples: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const buildPayload = (dry: boolean) => {
    const filters: Record<string, unknown> = {}
    if (cohort === 'recent_bookers') filters.days = recentDays
    if (cohort === 'custom_emails') {
      filters.custom_emails = customEmails
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
    const payload: Record<string, unknown> = {
      subject: subject.trim(),
      body,
      preheader: preheader.trim() || undefined,
      cohort,
      cohort_filters: filters,
      dry_run: dry,
    }
    if (ctaLabel.trim() && ctaUrl.trim()) {
      payload.cta = { label: ctaLabel.trim(), url: ctaUrl.trim() }
    }
    return payload
  }

  const handlePreview = async () => {
    setError(null)
    setPreviewResult(null)
    if (!subject.trim() || !body.trim()) {
      setError('กรุณากรอกหัวข้อและเนื้อหาก่อน')
      return
    }
    setPreviewing(true)
    try {
      const res = await apiFetch('/api/admin/campaigns', {
        method: 'POST',
        body: buildPayload(true),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          (data as { error?: string }).error || 'ไม่สามารถ preview ได้'
        )
        return
      }
      setPreviewResult({
        count: (data as { recipient_count?: number }).recipient_count || 0,
        samples: (data as { sample_emails?: string[] }).sample_emails || [],
      })
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setPreviewing(false)
    }
  }

  const handleSend = async () => {
    if (!previewResult) {
      toast.info('กดดูตัวอย่างก่อน')
      return
    }
    const ok = await confirm({
      title: `ส่งให้ ${previewResult.count} คน?`,
      body: `ส่งจริงไม่สามารถยกเลิกได้ — ตรวจสอบหัวข้อ "${subject}" และเนื้อหาให้รอบคอบ`,
      confirmLabel: 'ส่งเลย',
      variant: 'danger',
    })
    if (!ok) return

    setSending(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/campaigns', {
        method: 'POST',
        body: buildPayload(false),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          (data as { error?: string }).error || 'ส่งแคมเปญไม่สำเร็จ'
        )
        return
      }
      const succeeded = (data as { succeeded?: number }).succeeded || 0
      const failed = (data as { failed?: number }).failed || 0
      toast.success(
        `ส่งเรียบร้อย — สำเร็จ ${succeeded} คน${failed > 0 ? `, ล้มเหลว ${failed} คน` : ''}`
      )
      // Reset composer + reload list
      setSubject('')
      setPreheader('')
      setBody('สวัสดี {{name}},\n\nเรามีโปรโมชันใหม่...')
      setCtaLabel('')
      setCtaUrl('')
      setCustomEmails('')
      setPreviewResult(null)
      router.refresh()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Composer (3/5) */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={16} className="text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">เขียนแคมเปญ</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            หัวข้ออีเมล <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={150}
            placeholder="เช่น โปรโมชันเดือนเมษา ลด 20%"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Preheader (ข้อความ preview ใน inbox)
          </label>
          <input
            type="text"
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            maxLength={200}
            placeholder="โปรพิเศษเฉพาะลูกค้าเก่า..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            กลุ่มผู้รับ <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {COHORT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  cohort === opt.value
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  checked={cohort === opt.value}
                  onChange={() => setCohort(opt.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-500">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {cohort === 'recent_bookers' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ภายในกี่วัน
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={recentDays}
              onChange={(e) => setRecentDays(Number(e.target.value) || 30)}
              className="w-32 px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        )}

        {cohort === 'custom_emails' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              อีเมล (คั่นด้วย newline หรือ comma) — สูงสุด 1000
            </label>
            <textarea
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              rows={4}
              placeholder="a@example.com&#10;b@example.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-indigo-400"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            เนื้อหา <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            maxLength={20_000}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 resize-none"
          />
          <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            <strong>Markdown-lite:</strong> <code>**bold**</code>,{' '}
            <code>*italic*</code>, <code>[label](https://url)</code>, ขึ้นบรรทัด
            ใหม่ใช้เว้นบรรทัด. ใช้ <code>{'{{name}}'}</code> เพื่อใส่ชื่อลูกค้า
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ปุ่ม CTA — Label (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              maxLength={50}
              placeholder="ดูโปรโมชัน"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              CTA — URL
            </label>
            <input
              type="url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://gotjourneythailand.com/promotions"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        </div>

        {previewResult && (
          <div
            role="status"
            className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm"
          >
            <div className="flex items-center gap-2 text-indigo-800 font-bold mb-1">
              <Users size={14} />
              จะส่งถึง {previewResult.count.toLocaleString()} คน
            </div>
            {previewResult.samples.length > 0 && (
              <div className="text-xs text-slate-600 mt-2">
                ตัวอย่าง:{' '}
                <span className="font-mono">
                  {previewResult.samples.join(', ')}
                </span>
                {previewResult.count > previewResult.samples.length && (
                  <span> ... +{previewResult.count - previewResult.samples.length} อื่นๆ</span>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-start gap-2"
          >
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing || sending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {previewing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Eye size={14} />
            )}
            ดูตัวอย่าง
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!previewResult || sending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60"
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            ส่งจริง
          </button>
        </div>
      </div>

      {/* History (2/5) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            ประวัติแคมเปญ
          </h2>
          {campaigns.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              ยังไม่มีแคมเปญในระบบ
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 -mx-2">
              {campaigns.map((c) => (
                <li key={c.id} className="px-2 py-3">
                  <div className="flex items-start gap-2">
                    <StatusPill status={c.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {c.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {c.cohort} · ส่ง {c.succeeded_count}/{c.recipient_count}
                        {c.failed_count > 0 && (
                          <span className="text-red-500">
                            {' '}
                            · ล้มเหลว {c.failed_count}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {new Date(c.created_at).toLocaleString('th-TH')}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: CampaignRow['status'] }) {
  const cfg = (() => {
    switch (status) {
      case 'sent':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-700',
          bg: 'bg-emerald-50',
        }
      case 'sending':
        return { icon: Loader2, color: 'text-indigo-700', bg: 'bg-indigo-50' }
      case 'partial':
        return { icon: AlertCircle, color: 'text-amber-700', bg: 'bg-amber-50' }
      case 'failed':
        return { icon: XCircle, color: 'text-red-700', bg: 'bg-red-50' }
    }
  })()
  const Icon = cfg.icon
  return (
    <div
      className={`flex-shrink-0 w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center`}
    >
      <Icon
        size={12}
        className={`${cfg.color} ${status === 'sending' ? 'animate-spin' : ''}`}
      />
    </div>
  )
}
