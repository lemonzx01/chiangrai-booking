/**
 * ============================================================
 * POST /api/admin/loyalty/[userId]/adjust
 * ============================================================
 *
 * Manually credit or debit a user's loyalty balance. Used for
 * customer-service overrides (compensation for an outage,
 * reversing a fraudulent earn, etc.).
 *
 * Body: { delta: number, reason: string }
 *
 * Behavior:
 *   - Positive delta: balance + lifetime BOTH go up (treated as
 *     bonus points that count toward tier).
 *   - Negative delta: only balance goes down. Lifetime stays put
 *     because the original earn already happened. If you need to
 *     undo a fraudulent earn including its lifetime contribution,
 *     use the void path (separate, not built yet) — adjust is for
 *     normal CS work.
 *
 * Writes a 'adjust' kind ledger row + an audit log entry.
 *
 * Admin auth required.
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../../lib/authz'
import { createAdminClient } from '../../../../../../lib/supabase/server'
import { logAdminAction } from '../../../../../../lib/audit'
import { logger } from '../../../../../../lib/logger'

interface Params {
  params: Promise<{ userId: string }>
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { userId } = await params
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user id' },
        { status: 400 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as {
      delta?: unknown
      reason?: unknown
    }
    const delta = Number(body.delta)
    const reason =
      typeof body.reason === 'string' && body.reason.trim()
        ? body.reason.trim().slice(0, 500)
        : null

    if (!Number.isFinite(delta) || delta === 0) {
      return NextResponse.json(
        { error: 'จำนวนแต้มต้องไม่เป็นศูนย์และเป็นตัวเลข' },
        { status: 400 }
      )
    }
    if (!reason) {
      return NextResponse.json(
        { error: 'กรุณาระบุเหตุผลการปรับแต้ม' },
        { status: 400 }
      )
    }

    // Sanity cap — prevent fat-finger ±999,999 mistakes.
    if (Math.abs(delta) > 100000) {
      return NextResponse.json(
        { error: 'จำนวนแต้มสูงเกินขีดจำกัด (≤ 100,000)' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // 1. Look up the user — need the existing balance + name for
    //    the response and audit log.
    const { data: userRaw } = await supabase
      .from('users')
      .select('id, email, name, loyalty_points, loyalty_lifetime_earned')
      .eq('id', userId)
      .maybeSingle()
    const user = userRaw as {
      id: string
      email: string
      name: string | null
      loyalty_points: number | null
      loyalty_lifetime_earned: number | null
    } | null
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // 2. Update balance. Reject if it would go negative — the UI
    //    should surface this as "ยอดติดลบไม่ได้".
    const newBalance = (user.loyalty_points || 0) + delta
    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'ยอดแต้มไม่สามารถติดลบได้' },
        { status: 400 }
      )
    }

    // 3. Lifetime moves only on positive adjustments (negative
    //    adjust ≠ undo of an earn — undo lives in the void
    //    path). This keeps tier eligibility "earned, never
    //    taken away" except via explicit admin void.
    const lifetimeBump = delta > 0 ? delta : 0
    const newLifetime = (user.loyalty_lifetime_earned || 0) + lifetimeBump

    await supabase
      .from('users')
      .update({
        loyalty_points: newBalance,
        loyalty_lifetime_earned: newLifetime,
      })
      .eq('id', userId)

    // 4. Ledger row.
    const { error: ledgerErr } = await supabase
      .from('loyalty_ledger')
      .insert({
        user_id: userId,
        delta,
        kind: 'adjust',
        source_type: 'manual',
        source_id: null,
        reason,
      })
    if (ledgerErr) {
      logger.error('loyalty: adjust ledger insert failed', {
        userId,
        error: ledgerErr.message,
      })
      // Counter is already updated; surface the error so admin
      // knows the audit row may be missing.
      return NextResponse.json(
        { error: 'ปรับแต้มสำเร็จ แต่บันทึก audit ไม่สำเร็จ' },
        { status: 500 }
      )
    }

    // 5. Admin audit log — fire-and-forget.
    void logAdminAction({
      actor: auth.user,
      request,
      action: 'loyalty.adjust',
      resource_type: 'user',
      resource_id: userId,
      metadata: {
        delta,
        reason,
        previous_balance: user.loyalty_points || 0,
        new_balance: newBalance,
        target_email: user.email,
      },
    })

    return NextResponse.json({
      ok: true,
      balance: newBalance,
      lifetimeEarned: newLifetime,
    })
  } catch (err) {
    logger.error('admin loyalty adjust threw', {
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
