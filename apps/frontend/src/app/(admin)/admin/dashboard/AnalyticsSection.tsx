/**
 * ============================================================
 * AnalyticsSection — growth-health widgets on the admin dashboard
 * ============================================================
 *
 * Server Component. Fetches /api/admin/analytics with cookies
 * forwarded, then renders four widgets:
 *
 *   1. 30-day signup trend (CSS bar chart, no chart library)
 *   2. Referral funnel — total / pending / qualified / rewarded /
 *      voided + conversion rate
 *   3. Top 5 referrers (qualified count)
 *   4. Coupon source breakdown + last-30d redemption stats
 *
 * Why no chart library: Recharts/Chart.js add ~70-150KB to the
 * admin bundle for what amounts to 30 vertical bars. CSS handles
 * this better — we just compute bar heights as percentages.
 *
 * Why server-rendered: the data is admin-only and small enough
 * to ship with the page. Re-fetching client-side every dashboard
 * visit would just waste a round-trip without adding interactivity.
 * ============================================================
 */

import {
  TrendingUp,
  Users,
  Gift,
  Award,
  Tag,
  Trophy,
  AlertTriangle,
} from 'lucide-react'
import { adminBackendJson } from '@/lib/admin-fetch'
import type { AnalyticsResponse } from '@chiangrai/shared/types'

// ---------------------------------------------------------------
// Data fetch — fail-soft so a backend hiccup doesn't break the
// whole dashboard page.
// ---------------------------------------------------------------

async function getAnalytics(): Promise<AnalyticsResponse | null> {
  try {
    return await adminBackendJson<AnalyticsResponse>('/api/admin/analytics')
  } catch {
    return null
  }
}

// ---------------------------------------------------------------
// Main component
// ---------------------------------------------------------------

export default async function AnalyticsSection() {
  const data = await getAnalytics()

  if (!data) {
    // Soft failure — show a small banner instead of crashing.
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            ไม่สามารถโหลดข้อมูล analytics ได้ในตอนนี้
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            ส่วนที่เหลือของ Dashboard ยังคงทำงานปกติ
          </p>
        </div>
      </div>
    )
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 mb-4">
        สุขภาพการเติบโต (30 วันล่าสุด)
      </h2>

      {/* ----- 30-day signup trend bar chart ----- */}
      <SignupTrendCard trend={data.signupsTrend30d} />

      {/* ----- Two-column row: referral funnel + top referrers ----- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <ReferralFunnelCard referrals={data.referrals} />
        </div>
        <TopReferrersCard topReferrers={data.referrals.topReferrers} />
      </div>

      {/* ----- Coupon breakdown ----- */}
      <CouponBreakdownCard coupons={data.coupons} className="mt-4" />
    </section>
  )
}

// ---------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------

function SignupTrendCard({
  trend,
}: {
  trend: AnalyticsResponse['signupsTrend30d']
}) {
  const max = Math.max(...trend.map((t) => t.count), 1)
  const totalSignups = trend.reduce((sum, t) => sum + t.count, 0)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-900">สมัครสมาชิก 30 วัน</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            {totalSignups}
          </div>
          <div className="text-xs text-slate-500">รวม</div>
        </div>
      </div>

      {/* Bar chart — 30 vertical bars at uniform width */}
      <div
        className="flex items-end gap-1 h-24 mt-4"
        role="img"
        aria-label={`กราฟสมัครสมาชิก 30 วันล่าสุด รวม ${totalSignups} คน`}
      >
        {trend.map((d) => {
          const heightPct = (d.count / max) * 100
          return (
            <div
              key={d.date}
              className="flex-1 bg-gradient-to-t from-indigo-200 to-indigo-500 rounded-t hover:from-indigo-300 hover:to-indigo-600 transition-colors relative group"
              style={{ height: `${Math.max(heightPct, 4)}%` }}
              title={`${d.date}: ${d.count} signup${d.count === 1 ? '' : 's'}`}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                {d.date}: {d.count}
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels — show first, middle, last */}
      <div className="flex justify-between mt-2 text-xs text-slate-400">
        <span>{trend[0]?.date.slice(5)}</span>
        <span>{trend[Math.floor(trend.length / 2)]?.date.slice(5)}</span>
        <span>{trend[trend.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  )
}

function ReferralFunnelCard({
  referrals,
}: {
  referrals: AnalyticsResponse['referrals']
}) {
  const stages = [
    {
      label: 'รวม',
      value: referrals.total,
      tone: 'slate',
    },
    {
      label: 'รอจอง',
      value: referrals.pending,
      tone: 'amber',
    },
    {
      label: 'ผ่านเงื่อนไข',
      value: referrals.qualified,
      tone: 'indigo',
    },
    {
      label: 'ออกคูปองแล้ว',
      value: referrals.rewarded,
      tone: 'emerald',
    },
    {
      label: 'ยกเลิก',
      value: referrals.voided,
      tone: 'red',
    },
  ] as const

  const toneStyles = {
    slate: 'bg-slate-50 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Gift size={18} className="text-emerald-600" />
          </div>
          <h3 className="font-bold text-slate-900">Referral funnel</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600">
            {referrals.conversionRate}%
          </div>
          <div className="text-xs text-slate-500">conversion</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {stages.map((s) => (
          <div
            key={s.label}
            className={`${toneStyles[s.tone]} rounded-lg p-3 text-center`}
          >
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-[11px] uppercase tracking-wide mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-slate-500 text-xs mb-0.5">30d signups</div>
          <div className="font-bold text-slate-900">
            {referrals.last30d.signups}
          </div>
        </div>
        <div>
          <div className="text-slate-500 text-xs mb-0.5">30d qualified</div>
          <div className="font-bold text-slate-900">
            {referrals.last30d.qualified}
          </div>
        </div>
        <div>
          <div className="text-slate-500 text-xs mb-0.5">30d rewarded</div>
          <div className="font-bold text-slate-900">
            {referrals.last30d.rewarded}
          </div>
        </div>
      </div>
    </div>
  )
}

function TopReferrersCard({
  topReferrers,
}: {
  topReferrers: AnalyticsResponse['referrals']['topReferrers']
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Trophy size={18} className="text-amber-600" />
        </div>
        <h3 className="font-bold text-slate-900">Top referrers</h3>
      </div>

      {topReferrers.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-400">
          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          ยังไม่มีผู้แนะนำที่ผ่านเงื่อนไข
        </div>
      ) : (
        <ol className="space-y-2">
          {topReferrers.map((r, i) => (
            <li
              key={`${r.emailMasked}-${i}`}
              className="flex items-center gap-3 py-1.5"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0
                    ? 'bg-amber-100 text-amber-700'
                    : i === 1
                      ? 'bg-slate-200 text-slate-700'
                      : i === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-500'
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {r.name || r.emailMasked}
                </div>
                {r.name && (
                  <div className="text-xs text-slate-500 truncate">
                    {r.emailMasked}
                  </div>
                )}
              </div>
              <span className="text-sm font-bold text-emerald-600">
                {r.qualifiedCount}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function CouponBreakdownCard({
  coupons,
  className = '',
}: {
  coupons: AnalyticsResponse['coupons']
  className?: string
}) {
  const total =
    coupons.bySource.admin +
    coupons.bySource.referralReferrer +
    coupons.bySource.referralReferee
  const adminPct = total > 0 ? (coupons.bySource.admin / total) * 100 : 0
  const referrerPct =
    total > 0 ? (coupons.bySource.referralReferrer / total) * 100 : 0
  const refereePct =
    total > 0 ? (coupons.bySource.referralReferee / total) * 100 : 0

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Tag size={18} className="text-purple-600" />
          </div>
          <h3 className="font-bold text-slate-900">Coupons</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">
            {coupons.totalActive}
          </div>
          <div className="text-xs text-slate-500">active</div>
        </div>
      </div>

      {/* Stacked bar showing source mix */}
      {total > 0 && (
        <div>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-3">
            <div
              className="bg-slate-500"
              style={{ width: `${adminPct}%` }}
              title={`Admin: ${coupons.bySource.admin}`}
            />
            <div
              className="bg-indigo-500"
              style={{ width: `${referrerPct}%` }}
              title={`Referrer rewards: ${coupons.bySource.referralReferrer}`}
            />
            <div
              className="bg-emerald-500"
              style={{ width: `${refereePct}%` }}
              title={`Referee rewards: ${coupons.bySource.referralReferee}`}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <LegendItem
              color="bg-slate-500"
              label="Admin-issued"
              value={coupons.bySource.admin}
            />
            <LegendItem
              color="bg-indigo-500"
              label="Referrer rewards"
              value={coupons.bySource.referralReferrer}
            />
            <LegendItem
              color="bg-emerald-500"
              label="Referee rewards"
              value={coupons.bySource.referralReferee}
            />
          </div>
        </div>
      )}

      {/* Last 30d activity */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-slate-500 text-xs mb-0.5 flex items-center gap-1">
            <Award size={12} />
            30d issued
          </div>
          <div className="font-bold text-slate-900">{coupons.last30d.issued}</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs mb-0.5">30d redeemed</div>
          <div className="font-bold text-slate-900">
            {coupons.last30d.redemptions}
          </div>
        </div>
        <div>
          <div className="text-slate-500 text-xs mb-0.5">30d ส่วนลดรวม</div>
          <div className="font-bold text-slate-900">
            ฿{coupons.last30d.totalDiscountThb.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-sm ${color} flex-shrink-0`} />
      <div className="min-w-0">
        <div className="text-xs text-slate-500 truncate">{label}</div>
        <div className="text-sm font-bold text-slate-900">{value}</div>
      </div>
    </div>
  )
}
