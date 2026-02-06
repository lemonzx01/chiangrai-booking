import { SupabaseClient } from '@supabase/supabase-js'

/**
 * เช็คห้องว่างของประเภทห้อง
 */
export async function checkRoomAvailability(
  supabase: SupabaseClient,
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): Promise<{ available: boolean; remaining: number; total: number }> {
  // ดึง total_rooms ของ room type นี้
  const { data: roomType } = await supabase
    .from('room_types')
    .select('total_rooms')
    .eq('id', roomTypeId)
    .single()

  const totalRooms = roomType?.total_rooms || 1

  // นับ booking ที่วันซ้อนทับ และยัง active อยู่
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
): Promise<{ available: boolean }> {
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
