/**
 * POST /api/admin/bookings/[code]/reschedule
 *
 * Admin moves a booking to a different date range. Re-checks
 * availability with the booking itself excluded (otherwise the
 * booking would conflict with itself), records the before/after
 * in the audit log, and emits an admin notification.
 *
 * Why a dedicated endpoint instead of the generic PATCH:
 *   PATCH /api/bookings/[code] writes any field. This one
 *   enforces a transaction-style flow:
 *     1. validate new dates
 *     2. re-run the availability checks
 *     3. update only on success
 *   Mixing those concerns into the generic PATCH would make
 *   the audit log noisier and would not catch overlap.
 *
 * Body:
 *   {
 *     "check_in_date": "YYYY-MM-DD",
 *     "check_out_date": "YYYY-MM-DD",
 *     "force": boolean?,           // skip availability check
 *     "reason": string?            // recorded in audit
 *   }
 *
 * Price recalculation is OUT OF SCOPE for v1: admins will
 * manually negotiate price changes with the customer if the
 * new range costs more or less. Forcing automatic Stripe
 * adjustments would require subscription-style off-session
 * charges which we don't have plumbed yet.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '../../../../../../lib/supabase/server'
import { requireAdmin } from '../../../../../../lib/authz'
import { verifyCsrfToken } from '../../../../../../lib/csrf'
import {
  checkRoomAvailability,
  checkCarAvailability,
} from '../../../../../../lib/availability'
import { createAdminNotification } from '../../../../../../services/notifications/admin-inbox'
import { logAdminAction } from '../../../../../../lib/audit'
import { logger } from '../../../../../../lib/logger'

interface Params {
  params: Promise<{ code: string }>
}

const rescheduleSchema = z
  .object({
    check_in_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันต้องเป็น YYYY-MM-DD'),
    check_out_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันต้องเป็น YYYY-MM-DD'),
    force: z.boolean().optional(),
    reason: z.string().max(500).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.check_out_date <= v.check_in_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['check_out_date'],
        message: 'check_out_date ต้องอยู่หลัง check_in_date',
      })
    }
  })

export async function POST(request: Request, { params }: Params) {
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { code } = await params

  // Parse + validate body
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = rescheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.issues },
      { status: 400 }
    )
  }
  const { check_in_date, check_out_date, force, reason } = parsed.data

  const supabase = await createAdminClient()

  // Load the booking — we need its id (so the availability check
  // can exclude it from the conflict tally), the room/car ids,
  // and the existing dates for the audit row.
  const { data: booking, error: loadErr } = await supabase
    .from('bookings')
    .select(
      'id, booking_code, status, room_type_id, hotel_id, car_id, check_in_date, check_out_date'
    )
    .eq('booking_code', code)
    .single()

  if (loadErr || !booking) {
    return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 })
  }

  // Refuse to reschedule cancelled / completed bookings — those
  // are terminal states and changing them silently would corrupt
  // historical reports.
  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
    return NextResponse.json(
      {
        error: `ไม่สามารถเลื่อนการจองที่อยู่ในสถานะ ${booking.status} ได้`,
      },
      { status: 400 }
    )
  }

  // Skip availability check entirely if dates didn't change —
  // saves a query and avoids a no-op audit row.
  const datesUnchanged =
    check_in_date === booking.check_in_date &&
    check_out_date === booking.check_out_date
  if (datesUnchanged) {
    return NextResponse.json({
      success: true,
      noop: true,
      booking,
    })
  }

  // Availability re-check, unless admin forces.
  if (!force) {
    if (booking.room_type_id) {
      const a = await checkRoomAvailability(
        supabase,
        booking.room_type_id,
        check_in_date,
        check_out_date,
        booking.id
      )
      if (!a.available) {
        return NextResponse.json(
          {
            error: a.blocked
              ? 'ช่วงวันที่เลือกถูกบล็อกไว้'
              : 'ห้องพักเต็มในช่วงวันที่เลือก',
            code: a.blocked ? 'DATES_BLOCKED' : 'ROOM_FULL',
          },
          { status: 409 }
        )
      }
    }
    if (booking.car_id) {
      const a = await checkCarAvailability(
        supabase,
        booking.car_id,
        check_in_date,
        check_out_date,
        booking.id
      )
      if (!a.available) {
        return NextResponse.json(
          {
            error: a.blocked
              ? 'ช่วงวันที่เลือกถูกบล็อกไว้'
              : 'รถไม่ว่างในช่วงวันที่เลือก',
            code: a.blocked ? 'DATES_BLOCKED' : 'CAR_FULL',
          },
          { status: 409 }
        )
      }
    }
  }

  // Apply the move.
  const { data: updated, error: updateErr } = await supabase
    .from('bookings')
    .update({
      check_in_date,
      check_out_date,
    })
    .eq('booking_code', code)
    .select()
    .single()

  if (updateErr) {
    logger.error('booking reschedule update failed', { code, error: updateErr })
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้' },
      { status: 500 }
    )
  }

  // Audit row — captures before + after + the admin's reason.
  // This is the kind of action that customers ask about months
  // later ("why was my booking moved?"), so the paper trail is
  // worth it.
  logAdminAction({
    actor: auth.user,
    request,
    action: 'booking.reschedule',
    resource_type: 'booking',
    resource_id: code,
    metadata: {
      before: {
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
      },
      after: {
        check_in_date,
        check_out_date,
      },
      forced: !!force,
      reason: reason || null,
    },
  })

  // In-app notification (lower-priority than the cancel/refund
  // ones, so severity:'info').
  createAdminNotification({
    type: 'booking.rescheduled',
    title: `เลื่อนการจอง ${code}`,
    body: `${booking.check_in_date} → ${check_in_date} (${check_out_date})${
      force ? ' [forced]' : ''
    }`,
    link: '/admin/bookings',
    data: {
      booking_code: code,
      old_check_in: booking.check_in_date,
      new_check_in: check_in_date,
      old_check_out: booking.check_out_date,
      new_check_out: check_out_date,
    },
    severity: 'info',
  })

  return NextResponse.json({ success: true, booking: updated })
}
