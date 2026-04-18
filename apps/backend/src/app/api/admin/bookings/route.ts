/**
 * POST /api/admin/bookings
 *
 * Admin-only endpoint for creating a booking that was paid
 * OFF-PLATFORM (bank transfer, cash at the counter, LINE Pay, etc.).
 *
 * Why this exists:
 *   Some partners still take walk-in bookings or bank transfers;
 *   admins need to log those into the same calendar that blocks
 *   online availability, so the room/car doesn't get double-sold.
 *
 * Difference vs. the public POST /api/bookings:
 *   - Bypasses Stripe entirely — no checkout session is created.
 *   - Inserts a `payments` row with status 'SUCCEEDED', with
 *     stripe_payment_intent_id = null and a synthetic marker
 *     ('manual:<method>') in stripe_checkout_session_id so we can
 *     still trace where the money came from.
 *   - Booking goes straight to PAID (or CONFIRMED if `paid=false`).
 *
 * Body:
 *   {
 *     "booking_type": "HOTEL" | "CAR" | "COMBO",
 *     "hotel_id": uuid?,
 *     "car_id": uuid?,
 *     "room_type_id": uuid?,
 *     "check_in_date": "YYYY-MM-DD",
 *     "check_out_date": "YYYY-MM-DD",
 *     "number_of_guests": number,
 *     "customer_name": string,
 *     "customer_email": string,
 *     "customer_phone": string,
 *     "special_requests": string?,
 *     "total_price": number,        // admin sets the price explicitly
 *     "currency": "THB" | "USD" | "EUR"?,
 *     "payment_method": "cash" | "bank_transfer" | "line_pay" | "other",
 *     "payment_reference": string?, // e.g. bank slip number
 *     "paid": boolean?,             // default true
 *     "notes": string?              // admin-only note saved to special_requests
 *   }
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/server'
import { requireAdmin } from '../../../../lib/authz'
import { verifyCsrfToken } from '../../../../lib/csrf'
import { bookingFormSchema } from '../../../../lib/validations'
import { generateBookingCode } from '../../../../lib/utils'
import { createAdminNotification } from '../../../../services/notifications/admin-inbox'
import { sendPartnerBookingNotification } from '../../../../services/notifications/partner'
import { logger } from '../../../../lib/logger'
import type { CurrencyEnum } from '@chiangrai/shared/types/supabase'

const SUPPORTED_CURRENCIES: CurrencyEnum[] = ['THB', 'USD', 'EUR']
const ALLOWED_METHODS = ['cash', 'bank_transfer', 'line_pay', 'other'] as const
type PaymentMethod = (typeof ALLOWED_METHODS)[number]

export async function POST(request: Request) {
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // ---- Validate core booking fields using the same schema as public POST
  let validated
  try {
    validated = bookingFormSchema.parse({
      booking_type: body.booking_type,
      hotel_id: body.hotel_id || undefined,
      car_id: body.car_id || undefined,
      room_type_id: body.room_type_id || undefined,
      car_package_id: body.car_package_id || undefined,
      currency: body.currency || 'THB',
      check_in_date: body.check_in_date,
      check_out_date: body.check_out_date,
      number_of_guests: body.number_of_guests,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      special_requests: body.special_requests || undefined,
    })
  } catch (validationError: unknown) {
    const details =
      typeof validationError === 'object' &&
      validationError !== null &&
      'errors' in validationError
        ? (validationError as { errors: unknown }).errors
        : validationError instanceof Error
          ? validationError.message
          : 'Validation failed'
    return NextResponse.json(
      { error: 'ข้อมูลการจองไม่ครบถ้วน', details },
      { status: 400 }
    )
  }

  // ---- Admin-only fields
  const totalPriceRaw = Number(body.total_price)
  if (!Number.isFinite(totalPriceRaw) || totalPriceRaw <= 0) {
    return NextResponse.json(
      { error: 'total_price ต้องมากกว่า 0' },
      { status: 400 }
    )
  }

  const paymentMethod = (body.payment_method || 'other') as PaymentMethod
  if (!ALLOWED_METHODS.includes(paymentMethod)) {
    return NextResponse.json(
      { error: `payment_method ต้องเป็นหนึ่งใน: ${ALLOWED_METHODS.join(', ')}` },
      { status: 400 }
    )
  }

  const paymentReference = typeof body.payment_reference === 'string' ? body.payment_reference.trim() : ''
  const paid = body.paid !== false // default true
  const adminNote = typeof body.notes === 'string' ? body.notes.trim() : ''

  const currency: CurrencyEnum = SUPPORTED_CURRENCIES.includes(
    (validated.currency || 'THB') as CurrencyEnum
  )
    ? (validated.currency as CurrencyEnum)
    : 'THB'

  const supabase = await createAdminClient()

  // ---- Verify FKs exist before we blindly insert
  if (validated.hotel_id) {
    const { data, error } = await supabase
      .from('hotels')
      .select('id, owner_id, partner_id, name_th, name_en')
      .eq('id', validated.hotel_id)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'ไม่พบโรงแรมที่เลือก' }, { status: 400 })
    }
  }
  if (validated.car_id) {
    const { data, error } = await supabase
      .from('cars')
      .select('id, owner_id, partner_id, name_th, name_en')
      .eq('id', validated.car_id)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'ไม่พบรถที่เลือก' }, { status: 400 })
    }
  }
  let verifiedRoomTypeId: string | null = validated.room_type_id || null
  if (verifiedRoomTypeId) {
    const { data } = await supabase
      .from('room_types')
      .select('id, hotel_id')
      .eq('id', verifiedRoomTypeId)
      .single()
    if (!data) {
      verifiedRoomTypeId = null
    } else if (validated.hotel_id && (data as { hotel_id: string }).hotel_id !== validated.hotel_id) {
      return NextResponse.json(
        { error: 'room_type_id ไม่ได้อยู่ในโรงแรมที่เลือก' },
        { status: 400 }
      )
    }
  }

  // ---- Insert the booking atomically so availability blocks & rooms are
  //      still respected even for manual bookings. Admins can force-book
  //      by sending `force: true` (skips the atomic RPC) — default is
  //      false because the whole point of logging manual bookings is to
  //      make the calendar correct.
  const forceBook = body.force === true
  const bookingCode = generateBookingCode()

  const combinedSpecial =
    [validated.special_requests, adminNote]
      .filter(Boolean)
      .join('\n---\n') || null

  let bookingId: string | null = null

  if (!forceBook) {
    const isCarOnly = !!validated.car_id && !validated.hotel_id && !verifiedRoomTypeId
    const rpcName = isCarOnly ? 'create_car_booking_atomic' : 'create_booking_atomic'
    const rpcParams: Record<string, unknown> = {
      p_booking_code: bookingCode,
      p_booking_type: validated.booking_type,
      p_check_in_date: validated.check_in_date,
      p_check_out_date: validated.check_out_date,
      p_number_of_guests: validated.number_of_guests,
      p_customer_name: validated.customer_name,
      p_customer_email: validated.customer_email,
      p_customer_phone: validated.customer_phone,
      p_special_requests: combinedSpecial,
      p_total_price: totalPriceRaw,
      p_currency: currency,
    }
    if (isCarOnly) {
      rpcParams.p_car_id = validated.car_id
    } else {
      rpcParams.p_hotel_id = validated.hotel_id || null
      rpcParams.p_room_type_id = verifiedRoomTypeId
    }

    const { data: rpcBooking, error: rpcError } = await (supabase as any).rpc(rpcName, rpcParams)
    if (rpcError) {
      const msg = String(rpcError.message || '')
      if (msg.includes('DATES_BLOCKED')) {
        return NextResponse.json(
          {
            error: 'ช่วงวันที่เลือกไม่เปิดรับการจอง (ถูกบล็อก) — ใช้ force=true เพื่อบันทึกทับได้',
            code: 'DATES_BLOCKED',
          },
          { status: 409 }
        )
      }
      if (msg.includes('ROOM_FULL') || msg.includes('CAR_FULL')) {
        return NextResponse.json(
          {
            error: isCarOnly
              ? 'รถไม่ว่างในช่วงวันที่เลือก — ใช้ force=true เพื่อบันทึกทับได้'
              : 'ห้องไม่ว่างในช่วงวันที่เลือก — ใช้ force=true เพื่อบันทึกทับได้',
            code: 'FULL',
          },
          { status: 409 }
        )
      }
      logger.error('admin manual booking RPC failed', { rpcName, message: rpcError.message })
      return NextResponse.json({ error: 'ไม่สามารถสร้างการจองได้' }, { status: 500 })
    }
    bookingId = (rpcBooking as { id?: string })?.id || null
  } else {
    // Force path — direct insert, skips atomic availability check.
    const { data: inserted, error: insertError } = await supabase
      .from('bookings')
      .insert({
        booking_code: bookingCode,
        booking_type: validated.booking_type,
        hotel_id: validated.hotel_id || null,
        car_id: validated.car_id || null,
        room_type_id: verifiedRoomTypeId,
        check_in_date: validated.check_in_date,
        check_out_date: validated.check_out_date,
        number_of_guests: validated.number_of_guests,
        customer_name: validated.customer_name,
        customer_email: validated.customer_email,
        customer_phone: validated.customer_phone,
        special_requests: combinedSpecial,
        total_price: totalPriceRaw,
        currency,
        status: paid ? 'PAID' : 'CONFIRMED',
      })
      .select()
      .single()
    if (insertError || !inserted) {
      logger.error('admin forced booking insert failed', { error: insertError })
      return NextResponse.json({ error: 'ไม่สามารถสร้างการจองได้' }, { status: 500 })
    }
    bookingId = (inserted as { id: string }).id
  }

  if (!bookingId) {
    return NextResponse.json({ error: 'ไม่สามารถสร้างการจองได้' }, { status: 500 })
  }

  // ---- If admin marked it as paid, mark booking PAID and add a payment row.
  if (paid) {
    const { error: bkErr } = await supabase
      .from('bookings')
      .update({ status: 'PAID' })
      .eq('id', bookingId)
    if (bkErr) {
      logger.error('admin manual booking status update failed', { error: bkErr })
    }

    const { error: payErr } = await supabase.from('payments').insert({
      booking_id: bookingId,
      stripe_payment_intent_id: null,
      stripe_checkout_session_id: `manual:${paymentMethod}${paymentReference ? `:${paymentReference}` : ''}`,
      amount: totalPriceRaw,
      currency,
      status: 'SUCCEEDED',
      paid_at: new Date().toISOString(),
    })
    if (payErr) {
      logger.error('admin manual payment insert failed', { error: payErr })
    }
  }

  // ---- Fetch the full booking for response + notifications.
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, hotel:hotels(*), car:cars(*), room_type:room_types(*)')
    .eq('id', bookingId)
    .single()

  // ---- Notify the partner (owner) — they still need to know the room is booked.
  const typed = booking as any
  const ownerId =
    typed?.hotel?.owner_id ||
    typed?.hotel?.partner_id ||
    typed?.car?.owner_id ||
    typed?.car?.partner_id ||
    null
  if (ownerId && booking) {
    sendPartnerBookingNotification(ownerId, booking).catch((err) =>
      logger.error('sendPartnerBookingNotification (manual) failed', { error: err })
    )
  }

  const itemName =
    typed?.hotel?.name_th ||
    typed?.hotel?.name_en ||
    typed?.car?.name_th ||
    typed?.car?.name_en ||
    'รายการ'
  createAdminNotification({
    type: 'booking.manual_created',
    title: `จองแบบ manual: ${bookingCode}`,
    body: `${validated.customer_name} — ${itemName} (${paymentMethod})`,
    link: `/admin/bookings`,
    data: {
      booking_id: bookingId,
      booking_code: bookingCode,
      payment_method: paymentMethod,
      payment_reference: paymentReference || null,
      amount: totalPriceRaw,
      currency,
      forced: forceBook,
    },
    severity: 'info',
  })

  return NextResponse.json(
    {
      success: true,
      booking: booking || { id: bookingId, booking_code: bookingCode },
    },
    { status: 201 }
  )
}
