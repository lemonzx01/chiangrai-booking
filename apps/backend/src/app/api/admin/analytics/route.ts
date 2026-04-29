/**
 * ============================================================
 * GET /api/admin/analytics
 * ============================================================
 *
 * Deeper metrics for the admin dashboard. Sits alongside the
 * existing /api/dashboard/stats — that endpoint owns the simple
 * counts (DashboardStats type, used by other features), this
 * one owns the richer analytics that powers the "growth health"
 * section on the dashboard.
 *
 * Why a separate endpoint:
 *   - The existing stats endpoint has a stable shape used by
 *     other consumers; growing it would risk breaking them.
 *   - This payload is bigger and slower (4 queries plus joins),
 *     so it's helpful to keep it independently cacheable.
 *   - We can expand this freely without touching the DashboardStats
 *     type contract.
 *
 * Returns:
 *   - referrals: funnel counts + last-30d activity + top 5 referrers
 *   - coupons: total active + by-source breakdown + redemption stats
 *   - signupsTrend30d: per-day count for the last 30 days
 *
 * Mock mode: returns plausible fake numbers so dev dashboards
 * have something to render without a populated DB.
 *
 * Admin-only.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/authz'
import { createAdminClient } from '../../../../lib/supabase/server'
import { isMockMode } from '../../../../lib/auth'
import { withPrivateNoStore } from '../../../../lib/cache'
import { logger } from '../../../../lib/logger'
import type { AnalyticsResponse } from '@chiangrai/shared/types'

// Re-export for convenience — older callers may have imported from
// this route file directly. Shared type lives in @chiangrai/shared.
export type { AnalyticsResponse }

const MOCK_RESPONSE: AnalyticsResponse = {
  referrals: {
    total: 12,
    pending: 5,
    qualified: 3,
    rewarded: 3,
    voided: 1,
    conversionRate: 25,
    last30d: { signups: 7, qualified: 2, rewarded: 2 },
    topReferrers: [
      { name: 'Somchai J.', emailMasked: 's***@example.com', qualifiedCount: 3 },
      { name: 'Niran K.', emailMasked: 'n***@gmail.com', qualifiedCount: 2 },
      { name: 'Aor R.', emailMasked: 'a***@hotmail.com', qualifiedCount: 1 },
    ],
  },
  coupons: {
    totalActive: 18,
    bySource: { admin: 8, referralReferrer: 5, referralReferee: 5 },
    last30d: { issued: 6, redemptions: 4, totalDiscountThb: 1560 },
  },
  signupsTrend30d: buildMockTrend(),
}

function buildMockTrend(): Array<{ date: string; count: number }> {
  const out: Array<{ date: string; count: number }> = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    out.push({
      date: d.toISOString().slice(0, 10),
      // Light synthetic variation so the bar chart isn't flat.
      count: Math.floor(Math.random() * 4) + (i % 7 === 0 ? 3 : 0),
    })
  }
  return out
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/**
 * Mask `john.doe@example.com` → `j***@example.com`. Same scheme
 * as lib/referral so the admin sees a consistent style across UI.
 */
function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return '[hidden]'
  const local = email.slice(0, at)
  const domain = email.slice(at)
  const masked = local.length <= 2 ? '*' : local[0] + '***'
  return masked + domain
}

/** ISO date for "now minus N days", at start of UTC day. */
function dateMinusDays(days: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - days)
  return d
}

// ---------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (isMockMode()) {
    return withPrivateNoStore(NextResponse.json(MOCK_RESPONSE))
  }

  try {
    const supabase = await createAdminClient()
    const cutoff30 = dateMinusDays(30).toISOString()

    // --------------------------------------------------------
    // 1. Pull all referrals (small table — capped by user count;
    //    even at 10k users this returns fast and avoids per-status
    //    round-trips).
    // --------------------------------------------------------
    const { data: refs, error: refsErr } = await supabase
      .from('referrals')
      .select('id, status, referrer_id, created_at')

    if (refsErr) {
      logger.error('analytics: referrals query failed', { error: refsErr.message })
    }

    const refsList = (refs as Array<{
      id: string
      status: string
      referrer_id: string
      created_at: string
    }> | null) || []

    const referralCounts = { pending: 0, qualified: 0, rewarded: 0, voided: 0 }
    const last30 = { signups: 0, qualified: 0, rewarded: 0 }
    const referrerCounts = new Map<string, number>()

    for (const r of refsList) {
      if (r.status in referralCounts) {
        referralCounts[r.status as keyof typeof referralCounts]++
      }
      if (r.created_at >= cutoff30) {
        last30.signups++
        if (r.status === 'qualified' || r.status === 'rewarded') last30.qualified++
        if (r.status === 'rewarded') last30.rewarded++
      }
      if (r.status === 'qualified' || r.status === 'rewarded') {
        referrerCounts.set(
          r.referrer_id,
          (referrerCounts.get(r.referrer_id) || 0) + 1
        )
      }
    }

    const total = refsList.length
    const conversionRate =
      total > 0 ? Math.round((referralCounts.rewarded / total) * 1000) / 10 : 0

    // --------------------------------------------------------
    // 2. Top referrers — resolve names for top 5 by qualified count.
    // --------------------------------------------------------
    const topIds = [...referrerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    let topReferrers: AnalyticsResponse['referrals']['topReferrers'] = []
    if (topIds.length > 0) {
      const { data: topUsers } = await supabase
        .from('users')
        .select('id, name, email')
        .in(
          'id',
          topIds.map(([id]) => id)
        )

      const userMap = new Map<string, { name: string | null; email: string }>(
        (
          (topUsers as Array<{ id: string; name: string | null; email: string }> | null) ||
          []
        ).map((u) => [u.id, { name: u.name, email: u.email }])
      )

      topReferrers = topIds
        .map(([id, qualifiedCount]) => {
          const u = userMap.get(id)
          if (!u) return null
          return {
            name: u.name,
            emailMasked: maskEmail(u.email),
            qualifiedCount,
          }
        })
        .filter(
          (r): r is AnalyticsResponse['referrals']['topReferrers'][number] => r !== null
        )
    }

    // --------------------------------------------------------
    // 3. Coupons — total, by source, last-30d issuance.
    // --------------------------------------------------------
    const { data: coupons } = await supabase
      .from('coupons')
      .select('id, source, is_active, created_at')

    const couponList = (coupons as Array<{
      id: string
      source: string | null
      is_active: boolean
      created_at: string
    }> | null) || []

    const bySource = { admin: 0, referralReferrer: 0, referralReferee: 0 }
    let totalActive = 0
    let issuedLast30 = 0
    for (const c of couponList) {
      if (c.is_active) totalActive++
      if (c.source === 'referral_referrer') bySource.referralReferrer++
      else if (c.source === 'referral_referee') bySource.referralReferee++
      else bySource.admin++ // null = manually created
      if (c.created_at >= cutoff30) issuedLast30++
    }

    // --------------------------------------------------------
    // 4. Coupon redemptions in last 30d — from payments table.
    //    discount_amount + coupon_code are populated when a
    //    coupon was applied at checkout.
    // --------------------------------------------------------
    const { data: redemptions } = await supabase
      .from('payments')
      .select('coupon_code, discount_amount, status, paid_at')
      .not('coupon_code', 'is', null)
      .gte('paid_at', cutoff30)

    const redemptionList = (redemptions as Array<{
      coupon_code: string | null
      discount_amount: number | string | null
      status: string
      paid_at: string | null
    }> | null) || []

    let redemptionsCount = 0
    let totalDiscountThb = 0
    for (const r of redemptionList) {
      if (r.status !== 'SUCCEEDED') continue
      redemptionsCount++
      totalDiscountThb += Number(r.discount_amount || 0)
    }

    // --------------------------------------------------------
    // 5. 30-day signup trend — bucket users.created_at into days.
    // --------------------------------------------------------
    const { data: users30 } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', cutoff30)

    const usersList = (users30 as Array<{ created_at: string }> | null) || []

    // Pre-seed every day in the window to 0 so the chart is dense
    // (no gaps where a quiet day would otherwise be missing).
    const buckets: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      buckets[dateMinusDays(i).toISOString().slice(0, 10)] = 0
    }
    for (const u of usersList) {
      const day = u.created_at.slice(0, 10)
      if (day in buckets) buckets[day]++
    }
    const signupsTrend30d = Object.entries(buckets)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // --------------------------------------------------------
    // Compose response
    // --------------------------------------------------------
    const payload: AnalyticsResponse = {
      referrals: {
        total,
        pending: referralCounts.pending,
        qualified: referralCounts.qualified,
        rewarded: referralCounts.rewarded,
        voided: referralCounts.voided,
        conversionRate,
        last30d: last30,
        topReferrers,
      },
      coupons: {
        totalActive,
        bySource,
        last30d: {
          issued: issuedLast30,
          redemptions: redemptionsCount,
          totalDiscountThb: Math.round(totalDiscountThb * 100) / 100,
        },
      },
      signupsTrend30d,
    }

    return withPrivateNoStore(NextResponse.json(payload))
  } catch (err) {
    logger.error('analytics: handler threw', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json(
      { error: 'ไม่สามารถโหลด analytics ได้' },
      { status: 500 }
    )
  }
}
