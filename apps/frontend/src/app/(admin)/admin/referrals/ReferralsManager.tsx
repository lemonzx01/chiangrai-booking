'use client'

/**
 * ============================================================
 * ReferralsManager — admin client component for the referral list
 * ============================================================
 *
 * Why split off from page.tsx:
 *   page.tsx is a Server Component (gets cookies + initial data).
 *   This file is the client-side interactivity: filter chips,
 *   re-fetch on filter change, void modal with reason input.
 *
 * Data flow:
 *   - SSR seed via initialReferrals
 *   - On filter change → fetch /api/admin/referrals?status=...
 *   - On void → open modal → POST → optimistically update row in
 *     state on success (avoid an extra refetch round-trip)
 * ============================================================
 */

import { useState, useMemo } from 'react'
import { Loader2, Ban, Check, Clock, Award, Gift, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'
import type { ReferralRow } from './page'

type StatusFilter = 'all' | 'pending' | 'qualified' | 'rewarded' | 'voided'

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'ทั้งหมด',
  pending: 'รอจอง',
  qualified: 'ผ่านเงื่อนไข',
  rewarded: 'ออกคูปองแล้ว',
  voided: 'ยกเลิก',
}

const STATUS_LABELS: Record<ReferralRow['status'], string> = {
  pending: 'รอจอง',
  qualified: 'ผ่านเงื่อนไข',
  rewarded: 'ออกคูปองแล้ว',
  voided: 'ยกเลิก',
}

/**
 * Supabase joins return either a single object or an array
 * depending on the cardinality the planner picked. Normalize
 * to "first user object or null".
 */
function pickUser(
  joined: ReferralRow['referrer'] | ReferralRow['referee']
): { name: string | null; email: string } | null {
  if (!joined) return null
  if (Array.isArray(joined)) return joined[0] || null
  return joined
}

export default function ReferralsManager({
  initialReferrals,
}: {
  initialReferrals: ReferralRow[]
}) {
  const toast = useToast()

  const [referrals, setReferrals] = useState<ReferralRow[]>(initialReferrals)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(false)

  // Void modal state
  const [voidingRow, setVoidingRow] = useState<ReferralRow | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidSubmitting, setVoidSubmitting] = useState(false)

  // ----------------------------------------------------------
  // Stats summary — derived from the current list, not a separate
  // query. The list is capped at 100 so this is O(100) max.
  // ----------------------------------------------------------
  const counts = useMemo(() => {
    const c = { pending: 0, qualified: 0, rewarded: 0, voided: 0, total: 0 }
    for (const r of referrals) {
      c[r.status]++
      c.total++
    }
    return c
  }, [referrals])

  // ----------------------------------------------------------
  // Filter handler — re-fetches with the chosen status param.
  // We could filter client-side from the seeded list, but the
  // SSR seed is only the newest 100 *unfiltered*; for "show me
  // all voided" we need to actually requery.
  // ----------------------------------------------------------
  async function changeFilter(next: StatusFilter) {
    if (next === filter) return
    setFilter(next)
    setLoading(true)
    try {
      const url =
        next === 'all'
          ? '/api/admin/referrals'
          : `/api/admin/referrals?status=${next}`
      const res = await apiFetch(url)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          data?.error || 'ไม่สามารถโหลดข้อมูลได้'
        )
        return
      }
      setReferrals(data.referrals || [])
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------------------------------------
  // Void flow — opens modal asking for reason, then POSTs.
  // On success we splice the updated row in place rather than
  // refetching, so the admin's scroll position is preserved.
  // ----------------------------------------------------------
  function openVoid(row: ReferralRow) {
    setVoidingRow(row)
    setVoidReason('')
  }
  function closeVoid() {
    if (voidSubmitting) return
    setVoidingRow(null)
    setVoidReason('')
  }
  async function submitVoid() {
    if (!voidingRow) return
    const reason = voidReason.trim()
    setVoidSubmitting(true)
    try {
      const res = await apiFetch(
        `/api/admin/referrals/${voidingRow.id}/void`,
        {
          method: 'POST',
          body: { reason: reason || undefined },
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'ยกเลิกไม่สำเร็จ')
        return
      }
      // Local update — flip the row to 'voided' in place.
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === voidingRow.id ? { ...r, status: 'voided' as const } : r
        )
      )
      toast.success('ยกเลิกการแนะนำเรียบร้อย')
      closeVoid()
    } catch {
      toast.error('ยกเลิกไม่สำเร็จ')
    } finally {
      setVoidSubmitting(false)
    }
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div>
      {/* Stats summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <StatCard
          icon={<Gift size={18} />}
          label="ทั้งหมด"
          value={counts.total}
          tone="slate"
        />
        <StatCard
          icon={<Clock size={18} />}
          label={STATUS_LABELS.pending}
          value={counts.pending}
          tone="amber"
        />
        <StatCard
          icon={<Check size={18} />}
          label={STATUS_LABELS.qualified}
          value={counts.qualified}
          tone="indigo"
        />
        <StatCard
          icon={<Award size={18} />}
          label={STATUS_LABELS.rewarded}
          value={counts.rewarded}
          tone="emerald"
        />
        <StatCard
          icon={<Ban size={18} />}
          label={STATUS_LABELS.voided}
          value={counts.voided}
          tone="red"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Gift className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">
              {filter === 'all'
                ? 'ยังไม่มีรายการแนะนำเพื่อน'
                : `ไม่พบรายการสถานะ "${FILTER_LABELS[filter]}"`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th>วันที่</Th>
                  <Th>ผู้แนะนำ</Th>
                  <Th>ผู้ถูกแนะนำ</Th>
                  <Th>รหัส</Th>
                  <Th>สถานะ</Th>
                  <Th>คูปองที่ออก</Th>
                  <Th align="right">การกระทำ</Th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => {
                  const referrer = pickUser(r.referrer)
                  const referee = pickUser(r.referee)
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                    >
                      <Td>
                        <span className="text-slate-600">
                          {formatDate(r.created_at)}
                        </span>
                      </Td>
                      <Td>
                        <UserCell user={referrer} />
                      </Td>
                      <Td>
                        <UserCell user={referee} />
                      </Td>
                      <Td>
                        <code className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">
                          {r.referral_code}
                        </code>
                      </Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                      <Td>
                        {r.referrer_coupon_code || r.referee_coupon_code ? (
                          <div className="space-y-1 text-xs font-mono text-slate-600">
                            {r.referrer_coupon_code && (
                              <div title="คูปองสำหรับผู้แนะนำ">
                                <span className="text-slate-400">R:</span>{' '}
                                {r.referrer_coupon_code}
                              </div>
                            )}
                            {r.referee_coupon_code && (
                              <div title="คูปองสำหรับผู้ถูกแนะนำ">
                                <span className="text-slate-400">F:</span>{' '}
                                {r.referee_coupon_code}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </Td>
                      <Td align="right">
                        {r.status !== 'voided' && (
                          <button
                            onClick={() => openVoid(r)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            ยกเลิก
                          </button>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Void modal */}
      {voidingRow && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeVoid}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  ยกเลิกการแนะนำ
                </h3>
              </div>
              <button
                onClick={closeVoid}
                disabled={voidSubmitting}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-sm text-slate-600 mb-4 space-y-2">
              <p>
                การยกเลิกจะทำให้รายการแนะนำนี้ถูกตั้งสถานะเป็น{' '}
                <strong>voided</strong>{' '}
                และจะถูกบันทึกใน audit log พร้อมเหตุผลที่ระบุ
              </p>
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <strong>หมายเหตุ:</strong> การยกเลิกไม่ได้ disable
                คูปองที่ออกไปแล้ว — ต้องไปจัดการที่หน้าคูปองแยกต่างหาก
              </p>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1">
              เหตุผล (ไม่บังคับ — แต่แนะนำให้ระบุ)
            </label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value.slice(0, 500))}
              placeholder="เช่น: ตรวจพบหลายบัญชีจาก IP เดียวกัน"
              rows={3}
              maxLength={500}
              disabled={voidSubmitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {voidReason.length}/500
            </p>

            <div className="flex gap-3 mt-5">
              <button
                onClick={closeVoid}
                disabled={voidSubmitting}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                ปิด
              </button>
              <button
                onClick={submitVoid}
                disabled={voidSubmitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {voidSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                ยกเลิกการแนะนำ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------

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

function UserCell({
  user,
}: {
  user: { name: string | null; email: string } | null
}) {
  if (!user) {
    return <span className="text-slate-400 text-xs">[ลบไปแล้ว]</span>
  }
  return (
    <div className="space-y-0.5">
      {user.name && (
        <div className="text-slate-900 font-medium text-sm">{user.name}</div>
      )}
      <div className="text-slate-500 text-xs">{user.email}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: ReferralRow['status'] }) {
  const styles: Record<ReferralRow['status'], string> = {
    pending: 'bg-amber-100 text-amber-700',
    qualified: 'bg-slate-100 text-slate-900',
    rewarded: 'bg-emerald-100 text-emerald-700',
    voided: 'bg-slate-200 text-slate-600',
  }
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'slate' | 'amber' | 'indigo' | 'emerald' | 'red'
}) {
  const styles: Record<typeof tone, { bg: string; iconBg: string }> = {
    slate: { bg: 'bg-white', iconBg: 'bg-slate-100 text-slate-600' },
    amber: { bg: 'bg-white', iconBg: 'bg-amber-100 text-amber-600' },
    indigo: { bg: 'bg-white', iconBg: 'bg-slate-100 text-slate-900' },
    emerald: { bg: 'bg-white', iconBg: 'bg-emerald-100 text-emerald-600' },
    red: { bg: 'bg-white', iconBg: 'bg-red-100 text-red-600' },
  }
  return (
    <div
      className={`${styles[tone].bg} rounded-xl border border-slate-200 p-4 flex items-center gap-3`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles[tone].iconBg}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
