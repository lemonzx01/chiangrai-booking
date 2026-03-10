export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)

    const hotelId = searchParams.get('hotel_id')
    const carId = searchParams.get('car_id')
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 20)))
    const offset = Math.max(0, Number(searchParams.get('offset') || 0))

    if (!hotelId && !carId) {
      return NextResponse.json(
        { error: 'hotel_id หรือ car_id จำเป็นต้องระบุอย่างน้อยหนึ่งค่า' },
        { status: 400 }
      )
    }

    if (hotelId && carId) {
      return NextResponse.json(
        { error: 'ระบุได้ครั้งละ hotel_id หรือ car_id อย่างใดอย่างหนึ่ง' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (hotelId) {
      query = query.eq('hotel_id', hotelId)
    }
    if (carId) {
      query = query.eq('car_id', carId)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let aggregateQuery = supabase
      .from('reviews')
      .select('rating')
      .eq('is_approved', true)

    if (hotelId) {
      aggregateQuery = aggregateQuery.eq('hotel_id', hotelId)
    }
    if (carId) {
      aggregateQuery = aggregateQuery.eq('car_id', carId)
    }

    const { data: ratings } = await aggregateQuery
    const averageRating =
      ratings && ratings.length > 0
        ? Math.round(
            (ratings.reduce((sum, row) => sum + Number(row.rating || 0), 0) / ratings.length) * 10
          ) / 10
        : 0

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      average_rating: averageRating,
      limit,
      offset,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    const hotelId = typeof body?.hotel_id === 'string' ? body.hotel_id : null
    const carId = typeof body?.car_id === 'string' ? body.car_id : null
    const customerName = typeof body?.customer_name === 'string' ? body.customer_name.trim() : ''
    const customerEmail = typeof body?.customer_email === 'string' ? body.customer_email.trim().toLowerCase() : ''
    const rating = Number(body?.rating)
    const comment = typeof body?.comment === 'string' ? body.comment.trim() : null

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อและอีเมลผู้รีวิว' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'คะแนนรีวิวต้องอยู่ระหว่าง 1 ถึง 5' },
        { status: 400 }
      )
    }

    const hasHotel = Boolean(hotelId)
    const hasCar = Boolean(carId)
    if (hasHotel === hasCar) {
      return NextResponse.json(
        { error: 'กรุณาระบุ hotel_id หรือ car_id อย่างใดอย่างหนึ่ง' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        hotel_id: hotelId,
        car_id: carId,
        customer_name: customerName,
        customer_email: customerEmail,
        rating,
        comment,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

