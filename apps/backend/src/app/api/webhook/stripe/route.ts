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
import { logger } from '../../../../lib/logger'
import { isStripeMockMode } from '../../../../lib/auth'

export async function POST(request: Request) {
  const body = await request.text()

  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  let event: Stripe.Event

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !signature) {
    // Allowed without signature only in development OR mock mode
    if (process.env.NODE_ENV === 'production' && !isStripeMockMode()) {
      logger.error('webhook rejected: missing secret or signature in production')
      return NextResponse.json({ error: 'Webhook secret and signature required in production' }, { status: 400 })
    }

    try {
      event = JSON.parse(body) as Stripe.Event
      logger.warn('webhook parsed without signature verification', { eventType: event.type })
    } catch (parseError) {
      logger.error('webhook body parse failed', { error: parseError })
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }
  } else {
    // Production mode: Verify signature strictly
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (verifyError) {
      logger.error('webhook signature verification failed', { error: verifyError })
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }
  }

  const supabase = await createAdminClient()

  // ----- Idempotency: insert event_id, return 200 if already processed -----
  if (event.id) {
    const { error: idemErr } = await supabase
      .from('processed_webhooks')
      .insert({
        event_id: event.id,
        event_type: event.type,
        source: 'stripe',
      })

    if (idemErr) {
      // Postgres unique violation = duplicate event = already processed.
      if (idemErr.code === '23505') {
        logger.info('webhook duplicate event ignored', { eventId: event.id, type: event.type })
        return NextResponse.json({ received: true, duplicate: true })
      }
      // Any other error: log but DO NOT block — better to risk a duplicate
      // than miss a payment confirmation.
      logger.error('webhook idempotency insert failed', { eventId: event.id, error: idemErr })
    }
  }

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
            logger.error('partner onboarding update failed', { accountId: account.id, error })
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
          logger.error('payment status update failed', { sessionId: session.id, error: paymentError })
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
            logger.error('booking status update failed', { bookingId: session.metadata.booking_id, error: bookingError })
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
            sendBookingConfirmationEmail(emailData).catch((e) => logger.error('notification dispatch failed', { error: e }))

            const ownerId = booking.hotel?.owner_id || booking.car?.owner_id

            if (ownerId) {
              sendPartnerBookingNotification(ownerId, booking).catch((e) => logger.error('notification dispatch failed', { error: e }))
            }

            sendAdminBookingNotification(booking).catch((e) => logger.error('notification dispatch failed', { error: e }))
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
          logger.error('Failed to update expired payment status', { sessionId: session.id, error })
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
          logger.error('Failed to update failed payment status', {
            paymentIntentId: paymentIntent.id,
            error,
          })
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (paymentIntentId) {
          const { error } = await supabase
            .from('payments')
            .update({
              status: 'REFUNDED',
              refunded_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId)

          if (error) {
            logger.error('refunded payment update failed', { paymentIntentId, error })
          }
        }
        break
      }

      case 'charge.dispute.created': {
        // Mark related payment as DISPUTED so admin can investigate.
        const dispute = event.data.object as Stripe.Dispute
        const paymentIntentId =
          (typeof dispute.payment_intent === 'string'
            ? dispute.payment_intent
            : dispute.payment_intent?.id) || ''

        if (paymentIntentId) {
          const { error } = await supabase
            .from('payments')
            .update({
              status: 'DISPUTED',
              dispute_reason: dispute.reason,
              disputed_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId)

          if (error) {
            logger.error('dispute payment update failed', { paymentIntentId, error })
          }

          // Surface to admin notification center
          await supabase.from('admin_notifications').insert({
            type: 'DISPUTE',
            title: 'Payment dispute opened',
            message: `Stripe dispute opened (reason: ${dispute.reason}) on payment ${paymentIntentId}`,
            link: `/admin/payments?dispute=${dispute.id}`,
            is_read: false,
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('webhook processing error', { eventId: event.id, type: event.type, error })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
