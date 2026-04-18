import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Check if the date range overlaps any partner-set availability block.
 * Used both in the booking flow (rejection) and the customer-facing
 * availability endpoint (surfaces "blocked" in addition to "full").
 */
export async function hasBlockingOverlap(
  supabase: SupabaseClient,
  params: {
    hotelId?: string | null
    roomTypeId?: string | null
    carId?: string | null
    checkIn: string
    checkOut: string
  }
): Promise<boolean> {
  const { hotelId, roomTypeId, carId, checkIn, checkOut } = params

  // Build the OR clause dynamically. Only care about the resource types
  // actually passed in — room is covered by both room-scoped and
  // hotel-wide blocks; hotel-only booking is covered only by
  // hotel-wide blocks; car booking by car-scoped blocks.
  const orParts: string[] = []

  if (roomTypeId) {
    orParts.push(`room_type_id.eq.${roomTypeId}`)
    if (hotelId) {
      // Hotel-wide block rows have room_type_id IS NULL
      orParts.push(`and(hotel_id.eq.${hotelId},room_type_id.is.null)`)
    }
  } else if (hotelId) {
    orParts.push(`and(hotel_id.eq.${hotelId},room_type_id.is.null)`)
  }

  if (carId) {
    orParts.push(`car_id.eq.${carId}`)
  }

  if (orParts.length === 0) return false

  const { count } = await supabase
    .from('availability_blocks')
    .select('id', { count: 'exact', head: true })
    .lt('start_date', checkOut)
    .gt('end_date', checkIn)
    .or(orParts.join(','))

  return (count || 0) > 0
}

/**
 * เช็คห้องว่างของประเภทห้อง
 * Returns available=false if partner has blocked the dates OR
 * all rooms are booked.
 */
export async function checkRoomAvailability(
  supabase: SupabaseClient,
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): Promise<{ available: boolean; remaining: number; total: number; blocked?: boolean }> {
  const { data: roomType } = await supabase
    .from('room_types')
    .select('total_rooms, hotel_id')
    .eq('id', roomTypeId)
    .single()

  const totalRooms = roomType?.total_rooms || 1

  // Partner block check first — a single hotel-wide block can veto
  // all rooms, no point tallying reservations if dates are closed.
  const blocked = await hasBlockingOverlap(supabase, {
    hotelId: (roomType as { hotel_id?: string } | null)?.hotel_id ?? null,
    roomTypeId,
    checkIn,
    checkOut,
  })

  if (blocked) {
    return { available: false, remaining: 0, total: totalRooms, blocked: true }
  }

  let query = supabase
    .from('bookings')
    .select('id', { count: 'exact' })
    .eq('room_type_id', roomTypeId)
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn)
    .not('status', 'in', '("CANCELLED","COMPLETED")')

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId)
  }

  const { count } = await query

  const bookedCount = count || 0
  const remaining = totalRooms - bookedCount

  return {
    available: remaining > 0,
    remaining: Math.max(0, remaining),
    total: totalRooms,
  }
}

/**
 * เช็ครถว่าง
 */
export async function checkCarAvailability(
  supabase: SupabaseClient,
  carId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): Promise<{ available: boolean; blocked?: boolean }> {
  const blocked = await hasBlockingOverlap(supabase, {
    carId,
    checkIn,
    checkOut,
  })

  if (blocked) {
    return { available: false, blocked: true }
  }

  let query = supabase
    .from('bookings')
    .select('id', { count: 'exact' })
    .eq('car_id', carId)
    .lt('check_in_date', checkOut)
    .gt('check_out_date', checkIn)
    .not('status', 'in', '("CANCELLED","COMPLETED")')

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId)
  }

  const { count } = await query

  return {
    available: (count || 0) === 0,
  }
}
