/**
 * ============================================================
 * Stripe Webhook API Route - รับ Event จาก Stripe
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - รับและประมวลผล Webhook events จาก Stripe
 *   - อัพเดทสถานะการชำระเงินและการจอง
 *   - ส่งอีเมลยืนยันเมื่อชำระเงินสำเร็จ
 *
 * Endpoint:
 *   - POST /api/webhook/stripe - รับ Stripe webhook events
 *
 * Events ที่รองรับ:
 *   - checkout.session.completed: ชำระเงินสำเร็จ
 *   - checkout.session.expired: Session หมดอายุ
 *   - payment_intent.payment_failed: การชำระล้มเหลว
 *
 * Security:
 *   - ตรวจสอบ Stripe Signature เพื่อป้องกัน request ปลอม
 *
 * ============================================================
 */

export const dynamic = 'force-dynamic'

import { stripe } from '../../../../lib/stripe'
import { createAdminClient } from '../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { sendBookingConfirmationEmail } from '../../../../services/notifications/email'
import { sendPartnerBookingNotification, sendAdminBookingNotification } from '../../../../services/notifications/partner'

export async function POST(request: Request) {
  const body = await request.text()

  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  let event: Stripe.Event

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !signature) {
    // Test mode: อนุญาตเฉพาะ development เท่านั้น
    if (process.env.NODE_ENV === 'production') {
      console.error('Webhook rejected: missing secret or signature in production')
      return NextResponse.json({ error: 'Webhook secret and signature required in production' }, { status: 400 })
    }

    try {
      event = JSON.parse(body) as Stripe.Event
      console.warn('[DEV] Webhook event parsed without signature verification:', event.type)
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError)
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }
  } else {
    // Production mode: Verify signature strictly
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Webhook rejected: STRIPE_SECRET_KEY not configured')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (verifyError) {
      console.error('Webhook signature verification failed:', verifyError)
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }
  }

  const supabase = await createAdminClient()

  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account

        if (account.payouts_enabled && account.details_submitted) {
          const { error } = await supabase
            .from('partners')
            .update({
              stripe_onboarding_complete: true,
            })
            .eq('stripe_account_id', account.id)

          if (error) {
            console.error('Failed to update partner onboarding status:', error)
          }
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // อัพเดทสถานะ Payment เป็น SUCCEEDED
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'SUCCEEDED',
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_checkout_session_id', session.id)

        if (paymentError) {
          console.error('Failed to update payment status:', paymentError)
          return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
        }

        // อัพเดทสถานะ Booking เป็น PAID
        if (session.metadata?.booking_id) {
          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .update({ status: 'PAID' })
            .eq('id', session.metadata.booking_id)
            .select('*, hotel:hotels(*, owner_id), car:cars(*, owner_id)')
            .single()

          if (bookingError) {
            console.error('Failed to update booking status:', bookingError)
            return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 })
          }

          // ส่งอีเมลยืนยันการจอง (non-blocking)
          if (booking) {
            const itemName = booking.hotel?.name_th || booking.hotel?.name_en ||
                           booking.car?.name_th || booking.car?.name_en ||
                           'รายการที่จอง'
            const emailData = {
              customerName: booking.customer_name,
              customerEmail: booking.customer_email,
              bookingCode: booking.booking_code,
              bookingType: booking.booking_type as 'HOTEL' | 'CAR' | 'COMBO',
              itemName: itemName,
              checkIn: booking.check_in_date,
              checkOut: booking.check_out_date,
              totalPrice: booking.total_price,
              status: booking.status || 'PAID',
            }
            sendBookingConfirmationEmail(emailData).catch(console.error)

            const ownerId = booking.hotel?.owner_id || booking.car?.owner_id

            if (ownerId) {
              sendPartnerBookingNotification(ownerId, booking).catch(console.error)
            }

            sendAdminBookingNotification(booking).catch(console.error)
          }
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session

        const { error } = await supabase
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('stripe_checkout_session_id', session.id)

        if (error) {
          console.error('Failed to update expired payment status:', error)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        const { error } = await supabase
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (error) {
          console.error('Failed to update failed payment status:', error)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (paymentIntentId) {
          // อัพเดทสถานะ payment เป็น REFUNDED
          const { error } = await supabase
            .from('payments')
            .update({
              status: 'REFUNDED',
              refunded_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId)

          if (error) {
            console.error('Failed to update refunded payment status:', error)
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
