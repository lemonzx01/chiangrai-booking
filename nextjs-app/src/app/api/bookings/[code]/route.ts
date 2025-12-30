import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Params {
  params: Promise<{ code: string }>
}

// GET /api/bookings/[code] - Get booking by code
export async function GET(request: Request, { params }: Params) {
  try {
    const { code } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('bookings')
      .select('*, hotel:hotels(*), car:cars(*), payment:payments(*)')
      .eq('booking_code', code)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/bookings/[code] - Update booking status (admin only)
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { code } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('bookings')
      .update(body)
      .eq('booking_code', code)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
