'use client'

/**
 * ============================================================
 * LoyaltyManager — admin client component for the leaderboard
 * ============================================================
 *
 * Renders a sorted-by-lifetime table of all users + an adjust
 * modal that posts to /api/admin/loyalty/[userId]/adjust. Same
 * pattern as ReferralsManager: SSR-seeded list + client
 * interactivity, optimistic update on success.
 * ============================================================
 */

import { useState } from 'react'
import { Loader2, Award, X, Plus, Minus, TrendingUp, Search } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'
import type { LoyaltyUserRow } from './page'

type TierLevel = LoyaltyUserRow['tier']['level']

const TIER_STYLES: Record<TierLevel, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-300',
  silver: 'bg-slate-100 text-slate-700 border-slate-300',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
}

export default function LoyaltyManager({
  initialUsers,
}: {
  initialUsers: LoyaltyUserRow[]
}) {
  const toast = useToast()
  const [users, setUsers] = useState<LoyaltyUserRow[]>(initialUsers)
  const [query, setQuery] = useState('')

  // Adjust modal state
  const [adjusting, setAdjusting] = useState<LoyaltyUserRow | null>(null)
  const [delta, setDelta] = useState<string>('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Client-side filter — the list is capped at 100, so a name/
  // email contains() is fast enough without a debounced fetch.
  const visible = query.trim()
    ? users.filter((u) => {
        const q = query.trim().toLowerCase()
        return (
          (u.name || '').toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        )
      })
    : users

  function openAdjust(user: LoyaltyUserRow) {
    setAdjusting(user)
    setDelta('')
    setReason('')
  }

  function closeAdjust() {
    if (submitting) return
    setAdjusting(null)
  }

  async function submitAdjust() {
    if (!adjusting) return
    const numDelta = Number(delta)
    if (!Number.isFinite(numDelta) || numDelta === 0) {
      toast.error('ใส่จำนวนแต้ม (ไม่เป็นศูนย์)')
      return
    }
    if (!reason.trim()) {
      toast.error('กรุณาระบุเหตุผล')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiFetch(
        `/api/admin/loyalty/${adjusting.id}/adjust`,
        {
          method: 'POST',
          body: { delta: numDelta, reason: reason.trim() },
        }
      )
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        balance?: number
        lifetimeEarned?: number
        error?: string
      }
      if (!res.ok || !body.ok) {
        toast.error(body.error || 'ปรับแต้มไม่สำเร็จ')
        return
      }
      // Optimistic local update — replace the row in place so
      // admin's scroll position is preserved.
      setUsers((prev) =>
        prev.map((u) =>
          u.id === adjusting.id
            ? {
                ...u,
                balance: body.balance ?? u.balance,
                lifetimeEarned: body.lifetimeEarned ?? u.lifetimeEarned,
              }
            : u
        )
      )
      toast.success('ปรับแต้มเรียบร้อย')
      closeAdjust()
    } catch {
      toast.error('ปรับแต้มไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Search box */}
      <div className="mb-4 relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาด้วยชื่อหรืออีเมล"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-500 transition-colors"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {visible.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            {query.trim()
              ? `ไม่พบผู้ใช้ที่ตรงกับ "${query}"`
              : 'ยังไม่มีข้อมูลผู้ใช้'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th>#</Th>
                  <Th>ผู้ใช้</Th>
                  <Th align="right">ยอดสะสมปัจจุบัน</Th>
                  <Th align="right">สะสมตลอดชีพ</Th>
                  <Th>ระดับ</Th>
                  <Th align="right">การกระทำ</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u, i) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  >
                    <Td>
                      <span className="text-slate-400 text-xs">{i + 1}</span>
                    </Td>
                    <Td>
                      <div className="space-y-0.5">
                        {u.name && (
                          <div className="text-slate-900 font-medium">
                            {u.name}
                          </div>
                        )}
                        <div className="text-slate-500 text-xs">{u.email}</div>
                      </div>
                    </Td>
                    <Td align="right">
                      <span className="font-semibold text-slate-900 tracking-tight">
                        {u.balance.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">pts</span>
                    </Td>
                    <Td align="right">
                      <span className="text-slate-600">
                        {u.lifetimeEarned.toLocaleString()}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${TIER_STYLES[u.tier.level]}`}
                      >
                        <Award size={11} />
                        {u.tier.name}
                        <span className="opacity-70">·×{u.tier.multiplier}</span>
                      </span>
                    </Td>
                    <Td align="right">
                      <button
                        onClick={() => openAdjust(u)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:border-slate-900 hover:text-slate-900 transition-colors"
                      >
                        ปรับแต้ม
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust modal */}
      {adjusting && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeAdjust}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    ปรับแต้ม
                  </h3>
                  <p className="text-xs text-slate-500">
                    {adjusting.name || adjusting.email}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAdjust}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  จำนวนแต้ม
                </label>
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDelta((d) =>
                        d.startsWith('-') ? d.slice(1) : `-${d || '0'}`
                      )
                    }
                    className="px-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                    title="สลับเครื่องหมาย"
                  >
                    {delta.startsWith('-') ? (
                      <Plus size={14} />
                    ) : (
                      <Minus size={14} />
                    )}
                  </button>
                  <input
                    type="number"
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                    placeholder="100 หรือ -50"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ใส่จำนวนบวก (เพิ่มแต้ม) หรือลบ (หักแต้ม) — สูงสุด ±100,000
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  เหตุผล <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 500))}
                  placeholder="เช่น: ชดเชยกรณีระบบล่ม / รางวัลโปรโมชัน"
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-500 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">
                  {reason.length}/500
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>ยอดปัจจุบัน:</span>
                  <span className="font-semibold text-slate-900">
                    {adjusting.balance.toLocaleString()} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>หลังปรับ:</span>
                  <span className="font-semibold text-slate-900">
                    {(adjusting.balance + (Number(delta) || 0)).toLocaleString()} pts
                  </span>
                </div>
                {Number(delta) > 0 && (
                  <p className="pt-1 mt-1 border-t border-slate-200 text-amber-700">
                    💡 แต้มบวกจะเพิ่มยอดสะสมตลอดชีพด้วย — มีผลต่อระดับสมาชิก
                  </p>
                )}
                {Number(delta) < 0 && (
                  <p className="pt-1 mt-1 border-t border-slate-200 text-slate-500">
                    💡 แต้มลบจะลดเฉพาะยอดปัจจุบัน ไม่ลดยอดตลอดชีพ
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeAdjust}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={submitAdjust}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                ปรับแต้ม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
        align === 'right'
          ? 'text-right'
          : align === 'center'
            ? 'text-center'
            : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <td
      className={`px-4 py-3 ${
        align === 'right'
          ? 'text-right'
          : align === 'center'
            ? 'text-center'
            : 'text-left'
      }`}
    >
      {children}
    </td>
  )
}
