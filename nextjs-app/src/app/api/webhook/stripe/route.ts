import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { sendBookingConfirmationEmail } from '@/services/notifications/email'

// POST /api/webhook/stripe - Handle Stripe webhook events
export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Update payment status
        await supabase
          .from('payments')
          .update({
            status: 'SUCCEEDED',
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_checkout_session_id', session.id)

        // Update booking status
        if (session.metadata?.booking_id) {
          const { data: booking } = await supabase
            .from('bookings')
            .update({ status: 'PAID' })
            .eq('id', session.metadata.booking_id)
            .select('*, hotel:hotels(*), car:cars(*)')
            .single()

          // Send confirmation email
          if (booking) {
            sendBookingConfirmationEmail(booking).catch(console.error)
          }
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session

        // Update payment status to failed
        await supabase
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('stripe_checkout_session_id', session.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Update payment status
        await supabase
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
