import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyAdminToken, verifyUserToken, unauthorizedResponse, isMockMode } from '@/lib/auth'
import { findMockBookingByCode } from '@/lib/mock-data'

interface Params {
  params: Promise<{ code: string }>
}

// GET /api/bookings/[code] - Get booking by code
// Requires: booking code + email verification OR admin token OR user token with matching email
export async function GET(request: Request, { params }: Params) {
  try {
    const { code } = await params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.toLowerCase()

    // Check if admin - can view all bookings
    const adminAuth = await verifyAdminToken()
    if (adminAuth.success) {
      // Admin can view any booking
      if (isMockMode()) {
        const booking = findMockBookingByCode(code)
        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }
        return NextResponse.json(booking)
      }

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
    }

    // Check if logged-in user
    const userAuth = await verifyUserToken()

    // Mock Mode
    if (isMockMode()) {
      const booking = findMockBookingByCode(code)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // Verify email matches
      const verifyEmail = userAuth.success ? userAuth.user?.email : email
      if (!verifyEmail) {
        return NextResponse.json(
          { error: 'Email verification required. Please provide email parameter.' },
          { status: 401 }
        )
      }

      if (booking.customer_email.toLowerCase() !== verifyEmail.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email does not match booking record' },
          { status: 403 }
        )
      }

      // Return booking without sensitive internal data
      return NextResponse.json({
        ...booking,
        // Hide internal IDs if not admin
        id: undefined,
      })
    }

    // Production Mode
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('bookings')
      .select('*, hotel:hotels(*), car:cars(*), payment:payments(*)')
      .eq('booking_code', code)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify email matches
    const verifyEmail = userAuth.success ? userAuth.user?.email : email
    if (!verifyEmail) {
      return NextResponse.json(
        { error: 'Email verification required. Please provide email parameter.' },
        { status: 401 }
      )
    }

    if (data.customer_email.toLowerCase() !== verifyEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match booking record' },
        { status: 403 }
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/bookings/[code] - Update booking status (admin only)
export async function PATCH(request: Request, { params }: Params) {
  try {
    // Verify admin authorization
    const auth = await verifyAdminToken()
    if (!auth.success) {
      return unauthorizedResponse('Admin access required')
    }

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
