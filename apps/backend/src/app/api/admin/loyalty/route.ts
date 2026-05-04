/**
 * ============================================================
 * GET /api/admin/loyalty — top earners
 * ============================================================
 *
 * Returns users ordered by loyalty_lifetime_earned DESC. Drives
 * the admin "loyalty leaderboard" page. Capped at 100 rows so
 * the list stays scannable; future iterations can add pagination
 * + search.
 *
 * Each row carries the computed tier + balance + lifetime so the
 * client doesn't have to recompute thresholds.
 *
 * Admin auth required.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/authz'
import { createAdminClient } from '../../../../lib/supabase/server'
import { withPrivateNoStore } from '../../../../lib/cache'
import { logger } from '../../../../lib/logger'
import { getTier } from '../../../../lib/loyalty'

const MAX_LIMIT = 100

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, name, email, loyalty_points, loyalty_lifetime_earned, created_at'
      )
      .order('loyalty_lifetime_earned', { ascending: false })
      .limit(MAX_LIMIT)

    if (error) {
      logger.error('admin loyalty list failed', { error: error.message })
      return NextResponse.json(
        { error: 'ไม่สามารถโหลดข้อมูลได้' },
        { status: 500 }
      )
    }

    const rows = (
      (data as Array<{
        id: string
        name: string | null
        email: string
        loyalty_points: number | null
        loyalty_lifetime_earned: number | null
        created_at: string
      }> | null) || []
    ).map((u) => {
      const lifetime = u.loyalty_lifetime_earned || 0
      const tier = getTier(lifetime)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        balance: u.loyalty_points || 0,
        lifetimeEarned: lifetime,
        tier: { level: tier.level, name: tier.name, multiplier: tier.multiplier },
        createdAt: u.created_at,
      }
    })

    return withPrivateNoStore(NextResponse.json({ users: rows }))
  } catch (err) {
    logger.error('admin loyalty handler threw', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
