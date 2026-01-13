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

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Stripe client instance */
import { stripe } from '../../../../lib/stripe'

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '../../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันดึง headers จาก request */
import { headers } from 'next/headers'

/** Stripe types */
import Stripe from 'stripe'

/** บริการส่งอีเมลยืนยันการจอง */
import { sendBookingConfirmationEmail } from '../../../../services/notifications/email'

/** บริการแจ้งเตือน Partner และ Admin */
import { sendPartnerBookingNotification, sendAdminBookingNotification } from '../../../../services/notifications/partner'

// ============================================================
// POST Handler - รับ Stripe Webhook Events
// ============================================================

/**
 * รับและประมวลผล Webhook events จาก Stripe
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบ Stripe Signature เพื่อยืนยันว่า request มาจาก Stripe จริง
 *   2. ประมวลผลตาม event type:
 *      - checkout.session.completed: อัพเดทสถานะเป็น SUCCEEDED และ PAID
 *      - checkout.session.expired: อัพเดทสถานะเป็น FAILED
 *      - payment_intent.payment_failed: อัพเดทสถานะเป็น FAILED
 *   3. ส่งอีเมลยืนยันเมื่อชำระเงินสำเร็จ
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} สถานะการรับ webhook
 *
 * @example
 *   // Stripe จะส่ง request มาเมื่อมี event เกิดขึ้น
 *   POST /api/webhook/stripe
 *   Headers: { "stripe-signature": "xxx" }
 */
export async function POST(request: Request) {
  // ดึง body เป็น text (Stripe ต้องการ raw body)
  const body = await request.text()

  // ดึง Stripe signature จาก headers
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  // ----------------------------------------------------------
  // ตรวจสอบ Signature
  // ----------------------------------------------------------
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  /** Stripe event object */
  let event: Stripe.Event

  try {
    // ตรวจสอบและ parse event
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // สร้าง Supabase Admin client
  const supabase = await createAdminClient()

  // ----------------------------------------------------------
  // ประมวลผลตาม Event Type
  // ----------------------------------------------------------
  try {
        switch (event.type) {
      // ============================================================
      // Case: Stripe Connect Account Updated
      // ============================================================
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        // Check if the account is now able to receive payouts
        if (account.payouts_enabled && account.details_submitted) {
          // Update the partner record in your database
          await supabase
            .from('partners')
            .update({ 
              stripe_onboarding_complete: true,
            })
            .eq('stripe_account_id', account.id);
        }
        break;
      }

      // ============================================================
      // Case: การชำระเงินสำเร็จ
      // ============================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // อัพเดทสถานะ Payment เป็น SUCCEEDED
        await supabase
          .from('payments')
          .update({
            status: 'SUCCEEDED',
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_checkout_session_id', session.id)

        // อัพเดทสถานะ Booking เป็น PAID
        if (session.metadata?.booking_id) {
          const { data: booking } = await supabase
            .from('bookings')
            .update({ status: 'PAID' })
            .eq('id', session.metadata.booking_id)
            .select('*, hotel:hotels(*, owner_id), car:cars(*, owner_id)')
            .single()

          // ส่งอีเมลยืนยันการจอง (non-blocking)
          if (booking) {
            sendBookingConfirmationEmail(booking).catch(console.error)

            // ส่งอีเมลแจ้งเตือน Partner (owner) และ Admin
            // หา owner_id จาก hotel หรือ car
            const ownerId = booking.hotel?.owner_id || booking.car?.owner_id
            
            if (ownerId) {
              sendPartnerBookingNotification(ownerId, booking).catch(console.error)
            }
            
            // ส่งอีเมลแจ้งเตือน Admin
            sendAdminBookingNotification(booking).catch(console.error)
          }
        }
        break
      }

      // ============================================================
      // Case: Checkout Session หมดอายุ
      // ============================================================
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session

        // อัพเดทสถานะ Payment เป็น FAILED
        await supabase
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('stripe_checkout_session_id', session.id)
        break
      }

      // ============================================================
      // Case: การชำระเงินล้มเหลว
      // ============================================================
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // อัพเดทสถานะ Payment เป็น FAILED
        await supabase
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        break
      }
    }

    // ส่งกลับ response ยืนยันว่ารับ event แล้ว
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
