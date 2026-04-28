'use client'

/**
 * ============================================================
 * Reviews Moderator — approve, reject, delete reviews
 * ============================================================
 */

import { useState } from 'react'
import { Check, X, Trash2, Star, Clock, ShieldCheck } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import type { AdminReview } from './page'

interface ReviewsResponse {
  reviews: AdminReview[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  summary: { pending: number; approved: number }
}

type FilterStatus = 'pending' | 'approved' | 'all'

export default function ReviewsModerator({
  initial,
}: {
  initial: ReviewsResponse
}) {
  const toast = useToast()
  const confirm = useConfirm()
  const [reviews, setReviews] = useState<AdminReview[]>(initial.reviews)
  const [summary, setSummary] = useState(initial.summary)
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [loading, setLoading] = useState(false)

  async function loadReviews(next: FilterStatus) {
    setFilter(next)
    setLoading(true)
    try {
      const res = await apiFetch(`/api/admin/reviews?status=${next}&limit=100`)
      const data = (await res.json()) as ReviewsResponse
      setReviews(data.reviews || [])
      setSummary(data.summary || summary)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Load reviews failed', err)
    } finally {
      setLoading(false)
    }
  }

  async function moderate(r: AdminReview, action: 'approve' | 'reject') {
    const body: Record<string, unknown> = { action }
    if (action === 'reject') {
      const reason = prompt('เหตุผลในการปฏิเสธ (ไม่บังคับ):') ?? ''
      if (reason.trim()) body.rejection_reason = reason.trim()
    }

    try {
      const res = await apiFetch(`/api/admin/reviews/${r.id}`, {
        method: 'PATCH',
        body,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error?.message || 'อัปเดตไม่สำเร็จ')

      const updated: AdminReview = data.review
      if (filter === 'pending') {
        // Approved/rejected reviews drop out of the pending list.
        setReviews((prev) => prev.filter((x) => x.id !== r.id))
      } else {
        setReviews((prev) => prev.map((x) => (x.id === r.id ? updated : x)))
      }
      setSummary((s) => ({
        pending: action === 'approve' ? Math.max(0, s.pending - 1) : s.pending,
        approved: action === 'approve' ? s.approved + 1 : s.approved,
      }))
      toast.success(action === 'approve' ? 'อนุมัติรีวิวแล้ว' : 'ปฏิเสธรีวิวแล้ว')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    }
  }

  async function remove(r: AdminReview) {
    const ok = await confirm({
      title: 'ลบรีวิวนี้ถาวร?',
      body: 'การลบนี้ย้อนกลับไม่ได้ — รีวิวจะหายจากระบบทั้งหมด',
      confirmLabel: 'ลบรีวิว',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const res = await apiFetch(`/api/admin/reviews/${r.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error?.message || 'ลบไม่สำเร็จ')
      }
      setReviews((prev) => prev.filter((x) => x.id !== r.id))
      setSummary((s) => ({
        pending: r.is_approved ? s.pending : Math.max(0, s.pending - 1),
        approved: r.is_approved ? Math.max(0, s.approved - 1) : s.approved,
      }))
      toast.success('ลบรีวิวสำเร็จ')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ลบไม่สำเร็จ')
    }
  }

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">รอตรวจสอบ</p>
              <p className="text-2xl font-bold text-slate-900">
                {summary.pending}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">อนุมัติแล้ว</p>
              <p className="text-2xl font-bold text-slate-900">
                {summary.approved}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'pending', label: 'รอตรวจสอบ' },
          { key: 'approved', label: 'อนุมัติแล้ว' },
          { key: 'all', label: 'ทั้งหมด' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => loadReviews(tab.key)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">กำลังโหลด...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          {filter === 'pending'
            ? 'ไม่มีรีวิวที่รอตรวจสอบ'
            : 'ยังไม่มีรีวิว'}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const target =
              r.hotel?.name_th || r.hotel?.name_en || r.car?.name_th || r.car?.name_en || '—'
            const targetType = r.hotel_id ? 'โรงแรม' : 'รถเช่า'
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 truncate">
                        {r.customer_name}
                      </p>
                      <span className="text-xs text-slate-400">
                        {r.customer_email}
                      </span>
                      {r.is_approved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                          <Check size={12} /> อนุมัติแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                          <Clock size={12} /> รอตรวจสอบ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {targetType}: <span className="font-medium text-slate-700">{target}</span>
                      {' · '}
                      {new Date(r.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>

                  <div className="flex gap-1 ml-3 flex-shrink-0">
                    {!r.is_approved && (
                      <button
                        onClick={() => moderate(r, 'approve')}
                        className="p-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                        title="อนุมัติ"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    {r.is_approved && (
                      <button
                        onClick={() => moderate(r, 'reject')}
                        className="p-2 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100"
                        title="เปลี่ยนเป็นรอตรวจสอบ"
                      >
                        <X size={18} />
                      </button>
                    )}
                    {!r.is_approved && (
                      <button
                        onClick={() => moderate(r, 'reject')}
                        className="p-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                        title="ปฏิเสธ"
                      >
                        <X size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => remove(r)}
                      className="p-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                      title="ลบถาวร"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={16}
                      className={
                        n <= r.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }
                    />
                  ))}
                  {/* Spam-score badge — only shown for pending
                      reviews with a score above the noise floor.
                      Color escalates: yellow ≥ 30, orange ≥ 50,
                      red ≥ 70 — gives admin a quick visual cue. */}
                  {!r.is_approved && (r.spam_score || 0) >= 30 && (
                    <SpamBadge
                      score={r.spam_score || 0}
                      reasons={r.spam_reasons || []}
                    />
                  )}
                </div>

                {r.comment && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {r.comment}
                  </p>
                )}

                {r.rejection_reason && (
                  <div className="mt-2 p-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                    <span className="font-semibold">เหตุผลที่ปฏิเสธ:</span>{' '}
                    {r.rejection_reason}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------
// SpamBadge — color-coded by score with reason chips
// ---------------------------------------------------------------

const REASON_LABELS: Record<string, string> = {
  many_links: 'ลิงก์มากผิดปกติ',
  multiple_links: 'มีหลายลิงก์',
  link_only: 'มีแค่ลิงก์',
  all_caps: 'พิมพ์ตัวพิมพ์ใหญ่หมด',
  mostly_caps: 'ตัวพิมพ์ใหญ่เยอะ',
  character_runs: 'พิมพ์ซ้ำตัวอักษร',
  long_run: 'มีตัวอักษรซ้ำยาว',
  too_short: 'สั้นเกินไป',
  low_content: 'เนื้อหาน้อย',
  emoji_heavy: 'อีโมจิเยอะผิดปกติ',
  profanity: 'มีคำหยาบ',
  spam_phrase: 'มีวลีน่าสงสัย',
}

function SpamBadge({ score, reasons }: { score: number; reasons: string[] }) {
  const tone =
    score >= 70
      ? 'bg-red-100 text-red-700 border-red-200'
      : score >= 50
        ? 'bg-orange-100 text-orange-700 border-orange-200'
        : 'bg-amber-100 text-amber-700 border-amber-200'

  return (
    <div
      className={`ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${tone}`}
      title={reasons.map((r) => REASON_LABELS[r] || r).join(', ')}
    >
      <span>⚠ น่าสงสัย {score}/100</span>
      {reasons.slice(0, 2).map((r) => (
        <span
          key={r}
          className="px-1.5 py-0.5 rounded bg-white/60 text-[10px] font-medium"
        >
          {REASON_LABELS[r] || r}
        </span>
      ))}
      {reasons.length > 2 && (
        <span className="text-[10px] opacity-70">+{reasons.length - 2}</span>
      )}
    </div>
  )
}
