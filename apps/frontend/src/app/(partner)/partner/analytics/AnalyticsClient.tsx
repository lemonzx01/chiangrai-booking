/**
 * ============================================================
 * Partner analytics dashboard (client)
 * ============================================================
 *
 * Layout:
 *   - 4 KPI tiles: revenue, bookings, occupancy %, refunded
 *   - Window picker: 7 / 30 / 90 / 365 days
 *   - Revenue timeline bar chart (pure CSS — no chart lib)
 *   - Top 5 days by revenue
 *   - Status breakdown donut (CSS conic-gradient)
 *   - Upcoming check-ins next 7 days callout
 *
 * Why no chart library:
 *   The two charts here are simple enough that a 30-line CSS
 *   solution beats a 100kb Recharts dependency. Bar heights
 *   are percentages of the max in the window; the donut is a
 *   single conic-gradient with stops summed in JS.
 * ============================================================
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Banknote,
  CalendarCheck,
  TrendingUp,
  Undo2,
  Users,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatCurrency } from '@chiangrai/shared/utils'

// ---------------------------------------------------------------
// Types — match the backend route's response shape
// ---------------------------------------------------------------

interface TimelinePoint {
  date: string
  revenue: number
  bookings: number
}

interface StatusBreakdown {
  PENDING: number
  CONFIRMED: number
  PAID: number
  CANCELLED: number
  COMPLETED: number
}

export interface StatsResponse {
  window: { from: string; to: string; days: number }
  totals: {
    revenue: number
    bookings: number
    cancelled: number
    refundedAmount: number
  }
  occupancy: {
    hotelNightsBooked: number
    hotelNightsTotal: number
    percent: number
  }
  upcoming: { count: number; next7Days: number }
  timeline: TimelinePoint[]
  topDates: TimelinePoint[]
  statusBreakdown: StatusBreakdown
  is_admin?: boolean
}

const WINDOWS = [7, 30, 90, 365] as const
type WindowSize = (typeof WINDOWS)[number]

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------

export default function AnalyticsClient({
  initial,
}: {
  initial: StatsResponse | null
}) {
  const [stats, setStats] = useState<StatsResponse | null>(initial)
  const [days, setDays] = useState<WindowSize>(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initial ? null : 'โหลดไม่สำเร็จ')

  const refresh = useCallback(
    async (newDays: WindowSize) => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiFetch(`/api/partner/stats?days=${newDays}`)
        if (!res.ok) throw new Error('โหลดสถิติไม่สำเร็จ')
        const data = (await res.json()) as StatsResponse
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'โหลดไม่สำเร็จ')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (days !== (initial?.window.days as WindowSize)) {
      void refresh(days)
    }
  }, [days, initial, refresh])

  if (error && !stats) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
        <p className="text-sm font-bold text-red-800">{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-500">
        <Loader2 className="animate-spin mx-auto mb-3" size={28} />
        <p className="text-sm">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Window picker */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-slate-500">
          ข้อมูล{' '}
          <span className="font-mono text-slate-700">{stats.window.from}</span>{' '}
          → <span className="font-mono text-slate-700">{stats.window.to}</span>
          {stats.is_admin && (
            <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
              admin view
            </span>
          )}
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {WINDOWS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                days === d
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              } disabled:opacity-50`}
            >
              {d} วัน
            </button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi
          label="รายได้รวม"
          sub="Revenue"
          value={formatCurrency(stats.totals.revenue)}
          icon={Banknote}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <Kpi
          label="การจองทั้งหมด"
          sub="Bookings"
          value={stats.totals.bookings.toString()}
          icon={CalendarCheck}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <Kpi
          label="อัตราเข้าพัก"
          sub="Occupancy"
          value={`${stats.occupancy.percent}%`}
          hint={`${stats.occupancy.hotelNightsBooked.toLocaleString()} / ${stats.occupancy.hotelNightsTotal.toLocaleString()} คืน`}
          icon={TrendingUp}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <Kpi
          label="คืนเงินไปแล้ว"
          sub="Refunded"
          value={formatCurrency(stats.totals.refundedAmount)}
          hint={`${stats.totals.cancelled} ยกเลิก`}
          icon={Undo2}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Upcoming callout */}
      {stats.upcoming.next7Days > 0 && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <Users className="text-indigo-600" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {stats.upcoming.next7Days} ลูกค้าจะเช็คอินใน 7 วันข้างหน้า
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              เตรียมที่พัก / รถ ให้พร้อม และตรวจสอบรายชื่อในหน้า "การจอง"
            </p>
          </div>
        </div>
      )}

      {/* Timeline + status side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">รายได้รายวัน</h3>
          <p className="text-xs text-slate-500 mb-4">
            แท่งสีเข้ม = รายได้, ตัวเลขข้างใต้ = จำนวนการจอง
          </p>
          <RevenueChart timeline={stats.timeline} />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            สถานะการจอง
          </h3>
          <StatusDonut breakdown={stats.statusBreakdown} />
        </div>
      </div>

      {/* Top dates */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          5 วันรายได้สูงสุดในช่วงนี้
        </h3>
        {stats.topDates.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">
            ยังไม่มีข้อมูลรายได้ในช่วงเวลานี้
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2 font-semibold">วันที่</th>
                  <th className="text-right py-2 font-semibold">การจอง</th>
                  <th className="text-right py-2 font-semibold">รายได้</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.topDates.map((row, i) => (
                  <tr key={row.date}>
                    <td className="py-2.5 font-mono text-slate-700">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2 ${
                          i === 0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {i + 1}
                      </span>
                      {row.date}
                    </td>
                    <td className="py-2.5 text-right text-slate-600">
                      {row.bookings}
                    </td>
                    <td className="py-2.5 text-right font-bold text-indigo-600">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------

function Kpi({
  label,
  sub,
  value,
  hint,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  sub: string
  value: string
  hint?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
      <div className="text-[10px] text-slate-400 italic mb-1.5">{sub}</div>
      <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        {value}
      </div>
      {hint && (
        <div className="text-[11px] text-slate-400 mt-1">{hint}</div>
      )}
    </div>
  )
}

/**
 * Native CSS bar chart. Each bar is a flex item; height is set
 * via inline style. Hover tooltip uses the title attribute.
 */
function RevenueChart({ timeline }: { timeline: TimelinePoint[] }) {
  if (timeline.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-slate-400">
        ยังไม่มีข้อมูลในช่วงเวลานี้
      </div>
    )
  }
  const max = Math.max(1, ...timeline.map((p) => p.revenue))
  return (
    <div className="flex items-end gap-1 h-40 overflow-x-auto pb-1">
      {timeline.map((p) => {
        const heightPct = (p.revenue / max) * 100
        return (
          <div
            key={p.date}
            className="flex-1 min-w-[8px] flex flex-col items-center group"
            title={`${p.date} · ${p.revenue.toLocaleString()} THB · ${p.bookings} จอง`}
          >
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full bg-indigo-500 group-hover:bg-indigo-600 rounded-t transition-colors"
                style={{ height: `${Math.max(2, heightPct)}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 mt-1 select-none">
              {p.bookings || ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * CSS conic-gradient donut. Avoids SVG-vs-mobile sizing
 * headaches and is fully accessible via the legend.
 */
function StatusDonut({ breakdown }: { breakdown: StatusBreakdown }) {
  const items: Array<{ key: keyof StatusBreakdown; label: string; color: string }> = [
    { key: 'PENDING', label: 'รอดำเนินการ', color: '#F59E0B' },
    { key: 'CONFIRMED', label: 'ยืนยันแล้ว', color: '#3B82F6' },
    { key: 'PAID', label: 'ชำระแล้ว', color: '#10B981' },
    { key: 'COMPLETED', label: 'เสร็จสิ้น', color: '#6B7280' },
    { key: 'CANCELLED', label: 'ยกเลิก', color: '#EF4444' },
  ]
  const total = items.reduce((s, i) => s + (breakdown[i.key] || 0), 0)

  if (total === 0) {
    return (
      <div className="text-sm text-slate-400 py-8 text-center">
        ยังไม่มีการจอง
      </div>
    )
  }

  // Build the conic-gradient stops
  let cursor = 0
  const stops: string[] = []
  for (const item of items) {
    const value = breakdown[item.key] || 0
    if (value === 0) continue
    const start = (cursor / total) * 360
    cursor += value
    const end = (cursor / total) * 360
    stops.push(`${item.color} ${start}deg ${end}deg`)
  }
  const gradient = `conic-gradient(${stops.join(', ')})`

  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <div
          className="relative w-32 h-32 rounded-full"
          style={{ background: gradient }}
          role="img"
          aria-label="Status breakdown donut chart"
        >
          <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
            <div className="text-2xl font-black text-slate-900">{total}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              total
            </div>
          </div>
        </div>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const value = breakdown[item.key] || 0
          if (value === 0) return null
          const pct = Math.round((value / total) * 100)
          return (
            <li
              key={item.key}
              className="flex items-center justify-between text-xs"
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-slate-700">{item.label}</span>
              </span>
              <span className="text-slate-500">
                {value} <span className="text-slate-400">({pct}%)</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
