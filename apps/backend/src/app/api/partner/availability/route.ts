/**
 * ============================================================
 * Partner Availability API
 * ============================================================
 *
 * Lets a partner (or admin) list and create availability blocks
 * — date ranges where one of their hotels/rooms/cars is NOT
 * accepting new bookings (maintenance, private events, etc.).
 *
 * Endpoints:
 *   GET  /api/partner/availability
 *     ?hotel_id=uuid | ?car_id=uuid     (one filter required)
 *     &from=YYYY-MM-DD&to=YYYY-MM-DD    (optional window)
 *     -> { data: AvailabilityBlock[], bookings: BookingRow[] }
 *
 *   POST /api/partner/availability
 *     body: AvailabilityBlockInput
 *     -> 201 + created row
 *
 * Ownership:
 *   Partners can only block their own hotels/cars. Admins bypass.
 *
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/server'
import { requirePartner } from '../../../../lib/authz'
import { verifyAdminToken } from '../../../../lib/auth'
import { verifyCsrfToken } from '../../../../lib/csrf'
import { availabilityBlockSchema } from '../../../../lib/validations'
import { logger } from '../../../../lib/logger'

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/**
 * Confirm the caller either owns the target resource or is an admin.
 * Returns null on success or a NextResponse on failure.
 */
async function ensureResourceOwnership(
  userId: string,
  isAdmin: boolean,
  params: { hotelId?: string | null; carId?: string | null }
): Promise<NextResponse | null> {
  if (isAdmin) return null

  const supabase = await createAdminClient()

  if (params.hotelId) {
    const { data, error } = await supabase
      .from('hotels')
      .select('id, owner_id')
      .eq('id', params.hotelId)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }
    if ((data as { owner_id: string | null }).owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (params.carId) {
    const { data, error } = await supabase
      .from('cars')
      .select('id, owner_id')
      .eq('id', params.carId)
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }
    if ((data as { owner_id: string | null }).owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return null
}

// ------------------------------------------------------------
// GET — list blocks and bookings for a resource
// ------------------------------------------------------------

export async function GET(request: Request) {
  const auth = await requirePartner()
  if (!auth.ok) return auth.response

  // Admins can query any resource; partners limited to their own.
  const adminCheck = await verifyAdminToken()
  const isAdmin = adminCheck.success === true

  const { searchParams } = new URL(request.url)
  const hotelId = searchParams.get('hotel_id')
  const carId = searchParams.get('car_id')
  const from = searchParams.get('from') // YYYY-MM-DD
  const to = searchParams.get('to')

  if (!hotelId && !carId) {
    return NextResponse.json(
      { error: 'ระบุ hotel_id หรือ car_id' },
      { status: 400 }
    )
  }
  if (hotelId && carId) {
    return NextResponse.json(
      { error: 'ระบุ hotel_id หรือ car_id อย่างใดอย่างหนึ่ง' },
      { status: 400 }
    )
  }

  const ownErr = await ensureResourceOwnership(auth.user.id, isAdmin, {
    hotelId,
    carId,
  })
  if (ownErr) return ownErr

  const supabase = await createAdminClient()

  // ---- blocks ----
  let blockQuery = supabase
    .from('availability_blocks')
    .select('*')
    .order('start_date', { ascending: true })

  if (hotelId) blockQuery = blockQuery.eq('hotel_id', hotelId)
  if (carId) blockQuery = blockQuery.eq('car_id', carId)

  // Window filter: [from, to) overlap.
  if (from) blockQuery = blockQuery.gt('end_date', from)
  if (to) blockQuery = blockQuery.lt('start_date', to)

  const { data: blocks, error: blockErr } = await blockQuery
  if (blockErr) {
    logger.error('failed to list availability blocks', { error: blockErr })
    return NextResponse.json({ error: blockErr.message }, { status: 500 })
  }

  // ---- active bookings in window (so partner sees both booked + blocked) ----
  let bookingQuery = supabase
    .from('bookings')
    .select(
      'id, booking_code, check_in_date, check_out_date, status, customer_name, room_type_id'
    )
    .not('status', 'in', '("CANCELLED","COMPLETED")')
    .order('check_in_date', { ascending: true })

  if (hotelId) bookingQuery = bookingQuery.eq('hotel_id', hotelId)
  if (carId) bookingQuery = bookingQuery.eq('car_id', carId)
  if (from) bookingQuery = bookingQuery.gt('check_out_date', from)
  if (to) bookingQuery = bookingQuery.lt('check_in_date', to)

  const { data: bookings, error: bookingErr } = await bookingQuery
  if (bookingErr) {
    logger.error('failed to list overlapping bookings', { error: bookingErr })
    // Don't fail the whole request — partner can still see blocks.
  }

  return NextResponse.json({
    data: blocks || [],
    bookings: bookings || [],
  })
}

// ------------------------------------------------------------
// POST — create a block
// ------------------------------------------------------------

export async function POST(request: Request) {
  const csrfFail = await verifyCsrfToken(request)
  if (csrfFail) return csrfFail

  const auth = await requirePartner()
  if (!auth.ok) return auth.response

  const adminCheck = await verifyAdminToken()
  const isAdmin = adminCheck.success === true

  const body = await request.json().catch(() => null)
  const parsed = availabilityBlockSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const input = parsed.data

  const ownErr = await ensureResourceOwnership(auth.user.id, isAdmin, {
    hotelId: input.hotel_id,
    carId: input.car_id,
  })
  if (ownErr) return ownErr

  // If room_type_id is set, confirm it belongs to the same hotel.
  if (input.room_type_id) {
    const supabase = await createAdminClient()
    const { data: rt } = await supabase
      .from('room_types')
      .select('id, hotel_id')
      .eq('id', input.room_type_id)
      .single()
    if (!rt || (rt as { hotel_id: string }).hotel_id !== input.hotel_id) {
      return NextResponse.json(
        { error: 'room_type_id ไม่ตรงกับ hotel_id' },
        { status: 400 }
      )
    }
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('availability_blocks')
    .insert({
      hotel_id: input.hotel_id || null,
      room_type_id: input.room_type_id || null,
      car_id: input.car_id || null,
      start_date: input.start_date,
      end_date: input.end_date,
      reason: input.reason,
      notes: input.notes || null,
      created_by: auth.user.id,
    })
    .select()
    .single()

  if (error) {
    logger.error('failed to create availability block', { error })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
