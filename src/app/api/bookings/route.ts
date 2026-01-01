import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendLineNotification } from '@/services/notifications/line'
import { generateBookingCode, calculateNights, calculateTotalPrice } from '@/lib/utils'

// GET /api/bookings - List all bookings (admin only)
export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    let query = supabase
      .from('bookings')
      .select('*, hotel:hotels(*), car:cars(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    // Generate booking code
    const booking_code = generateBookingCode()

    // Calculate total price based on booking type
    let total_price = body.total_price

    if (!total_price) {
      const nights = calculateNights(body.check_in_date, body.check_out_date)

      if (body.booking_type === 'HOTEL' && body.hotel_id) {
        const { data: hotel } = await supabase
          .from('hotels')
          .select('price_per_night')
          .eq('id', body.hotel_id)
          .single()
        total_price = hotel ? calculateTotalPrice(hotel.price_per_night, nights) : 0
      } else if (body.booking_type === 'CAR' && body.car_id) {
        const { data: car } = await supabase
          .from('cars')
          .select('price_per_day')
          .eq('id', body.car_id)
          .single()
        total_price = car ? calculateTotalPrice(car.price_per_day, nights) : 0
      }
    }

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        ...body,
        booking_code,
        total_price,
        status: 'PENDING',
      })
      .select('*, hotel:hotels(*), car:cars(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send Line notification (non-blocking)
    sendLineNotification(booking).catch(console.error)

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
