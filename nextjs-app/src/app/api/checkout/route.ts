import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

// POST /api/checkout - Create Stripe Checkout session
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { booking_id, success_url, cancel_url } = body

    const supabase = await createAdminClient()

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, hotel:hotels(*), car:cars(*)')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Create line items for Stripe
    const itemName =
      booking.booking_type === 'HOTEL'
        ? booking.hotel?.name_en || 'Hotel Booking'
        : booking.car?.name_en || 'Car Rental'

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'promptpay'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: itemName,
              description: `Booking: ${booking.booking_code}`,
            },
            unit_amount: Math.round(booking.total_price * 100), // Convert to satang
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/success?code=${booking.booking_code}`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/booking?cancelled=true`,
      metadata: {
        booking_id: booking.id,
        booking_code: booking.booking_code,
      },
      customer_email: booking.customer_email,
    })

    // Create payment record
    await supabase.from('payments').insert({
      booking_id: booking.id,
      stripe_checkout_session_id: session.id,
      amount: booking.total_price,
      currency: 'THB',
      status: 'PENDING',
    })

    return NextResponse.json({
      session_id: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
