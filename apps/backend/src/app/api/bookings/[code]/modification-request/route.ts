/**
 * POST /api/bookings/[code]/modification-request
 *
 * Customer-initiated request to change a booking's dates.
 * Unlike admin's `/admin/bookings/[code]/reschedule`, this
 * does NOT mutate the booking — it just creates an admin
 * inbox entry so the team can review and apply (or reject)
 * the change.
 *
 * Why a request flow instead of direct modification:
 *   - Customer-side date changes can affect price (longer
 *     stay → more nights to charge). Auto-charging differential
 *     amounts safely needs off-session Stripe charges that
 *     we don't have plumbed yet.
 *   - Pricing rules can change between the original booking
 *     and the new dates (peak vs off-peak). Admin needs a
 *     human-in-the-loop chance to confirm.
 *   - Some bookings have non-refundable promo rules; admin
 *     decides whether to honor those.
 *
 * Authentication:
 *   - Customer (user_token) — must own the booking via email
 *   - OR admin (admin_token) — for support handling on behalf
 *     of a customer over the phone
 *
 * Body:
 *   {
 *     "requested_check_in": "YYYY-MM-DD",
 *     "requested_check_out": "YYYY-MM-DD",
 *     "reason": string  // 1..500 chars, why customer wants the change
 *   }
 *
 * Response:
 *   201 { success: true, message: "..." }   on accept
 *   400/401/403/404 with localized error    on reject
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '../../../../../lib/supabase/server'
import {
  verifyUserToken,
  verifyAdminToken,
} from '../../../../../lib/auth'
import { verifyCsrfToken } from '../../../../../lib/csrf'
import { createAdminNotification } from '../../../../../services/notifications/admin-inbox'
import { logger } from '../../../../../lib/logger'

interface Params {
  params: Promise<{ code: string }>
}

const modSchema = z
  .object({
    requested_check_in: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันต้องเป็น YYYY-MM-DD'),
    requested_check_out: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันต้องเป็น YYYY-MM-DD'),
    reason: z
      .string()
      .min(1, 'กรุณาระบุเหตุผล')
      .max(500, 'เหตุผลยาวเกิน 500 ตัวอักษร'),
  })
  .superRefine((v, ctx) => {
    if (v.requested_check_out <= v.requested_check_in) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requested_check_out'],
        message: 'วันออกต้องอยู่หลังวันเข้า',
      })
    }
  })

export async function POST(request: Request, { params }: Params) {
  // CSRF first — this is a state-changing endpoint even though
  // it doesn't mutate the booking row, because it pings staff
  // (creates a notification) and an attacker spamming requests
  // would be annoying.
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  // Authentication: customer OR admin
  const userAuth = await verifyUserToken()
  const adminAuth = await verifyAdminToken()
  const isAdmin = adminAuth.success
  const userEmail = userAuth.success ? userAuth.user?.email : null
  if (!isAdmin && !userEmail) {
    return NextResponse.json(
      { error: 'กรุณาเข้าสู่ระบบเพื่อขอเลื่อนวัน' },
      { status: 401 }
    )
  }

  const { code } = await params

  // Parse + validate body
  let raw: Record<string, unknown>
  try {
    raw = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 })
  }
  const parsed = modSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ครบถ้วน', details: parsed.error.issues },
      { status: 400 }
    )
  }
  const { requested_check_in, requested_check_out, reason } = parsed.data

  // Reject requests for dates in the past — keep the inbox clean.
  const today = new Date().toISOString().slice(0, 10)
  if (requested_check_in < today) {
    return NextResponse.json(
      { error: 'วันที่ต้องการต้องเป็นอนาคต' },
      { status: 400 }
    )
  }

  const supabase = await createAdminClient()

  // Load the booking — we need to verify ownership and the
  // notification body needs the existing dates for context.
  const { data: booking, error: loadErr } = await supabase
    .from('bookings')
    .select(
      'id, booking_code, status, customer_name, customer_email, customer_phone, check_in_date, check_out_date'
    )
    .eq('booking_code', code)
    .single()

  if (loadErr || !booking) {
    return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 })
  }

  // Customer must own the booking by email.
  if (!isAdmin && userEmail) {
    if (booking.customer_email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ส่งคำขอสำหรับการจองนี้' },
        { status: 403 }
      )
    }
  }

  // Refuse on terminal statuses — can't reschedule a cancelled
  // or completed booking, even by request.
  if (
    booking.status === 'CANCELLED' ||
    booking.status === 'COMPLETED'
  ) {
    return NextResponse.json(
      {
        error: `ไม่สามารถส่งคำขอเลื่อนสำหรับการจองที่อยู่ในสถานะ ${booking.status}`,
      },
      { status: 400 }
    )
  }

  // Refuse no-op requests (same dates).
  if (
    requested_check_in === booking.check_in_date &&
    requested_check_out === booking.check_out_date
  ) {
    return NextResponse.json(
      { error: 'วันที่ที่ขอเหมือนเดิม กรุณาเลือกวันใหม่' },
      { status: 400 }
    )
  }

  // Drop a high-priority entry into the admin inbox. We use
  // type 'booking.modification_request' so admins can filter
  // for it. Severity 'warning' so it stands out from routine
  // booking confirmations.
  try {
    await createAdminNotification({
      type: 'booking.modification_request',
      title: `ขอเลื่อนวันจอง — ${code}`,
      body: `${booking.customer_name} ขอย้ายจาก ${booking.check_in_date}→${booking.check_out_date} เป็น ${requested_check_in}→${requested_check_out}. เหตุผล: ${reason}`,
      link: '/admin/bookings',
      data: {
        booking_id: booking.id,
        booking_code: code,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        old_check_in: booking.check_in_date,
        old_check_out: booking.check_out_date,
        new_check_in: requested_check_in,
        new_check_out: requested_check_out,
        reason,
        requested_by: isAdmin ? 'admin_on_behalf' : 'customer',
      },
      severity: 'warning',
    })
  } catch (err) {
    logger.error('modification-request notification failed', {
      code,
      error: err instanceof Error ? err.message : String(err),
    })
    // Don't fail the request — customer doesn't care that our
    // inbox infrastructure had a hiccup. Better to confirm the
    // request and follow up by hand than to bounce them out.
  }

  return NextResponse.json(
    {
      success: true,
      message:
        'ส่งคำขอเลื่อนวันเรียบร้อย ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง',
    },
    { status: 201 }
  )
}
