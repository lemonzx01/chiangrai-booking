/**
 * ============================================================
 * Checkout API Route - สร้าง Stripe Checkout Session
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - สร้าง Stripe Checkout session สำหรับการชำระเงิน
 *   - รองรับการชำระด้วยบัตรเครดิตและ PromptPay
 *   - บันทึกข้อมูล payment ลง database
 *
 * Endpoint:
 *   - POST /api/checkout - สร้าง Checkout session
 *
 * Request Body:
 *   - booking_id: ID ของการจอง
 *   - success_url: URL สำหรับ redirect เมื่อชำระสำเร็จ (optional)
 *   - cancel_url: URL สำหรับ redirect เมื่อยกเลิก (optional)
 *
 * Response:
 *   - session_id: Stripe Checkout session ID
 *   - url: URL สำหรับ redirect ไปหน้าชำระเงิน
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '@/lib/supabase/server'

/** Stripe client instance */
import { stripe } from '@/lib/stripe'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

// ============================================================
// POST Handler - สร้าง Stripe Checkout Session
// ============================================================

/**
 * สร้าง Stripe Checkout session สำหรับการชำระเงิน
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ดึงข้อมูลการจองจาก database
 *   2. สร้าง line items สำหรับ Stripe
 *   3. สร้าง Checkout session พร้อมกำหนดค่าต่างๆ
 *   4. บันทึก payment record ลง database
 *   5. ส่ง session ID และ URL กลับให้ client
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} Stripe session info
 *
 * @example
 *   POST /api/checkout
 *   Body: {
 *     "booking_id": "uuid-here",
 *     "success_url": "https://example.com/success",
 *     "cancel_url": "https://example.com/cancel"
 *   }
 *
 *   Response: {
 *     "session_id": "cs_xxx",
 *     "url": "https://checkout.stripe.com/xxx"
 *   }
 */
export async function POST(request: Request) {
  try {
    // ดึงข้อมูลจาก request body
    const body = await request.json()
    const { booking_id, success_url, cancel_url } = body

    // สร้าง Supabase Admin client
    const supabase = await createAdminClient()

    // ----------------------------------------------------------
    // ดึงข้อมูลการจองพร้อม partner information
    // ----------------------------------------------------------
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        '*, hotel:hotels(*, partner:partners(*)), car:cars(*, partner:partners(*))'
      )
      .eq('id', booking_id)
      .single()

    // ตรวจสอบว่าพบการจองหรือไม่
    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // ----------------------------------------------------------
    // ตรวจสอบว่ามีพาร์ทเนอร์หรือไม่ (สำหรับ Stripe Connect)
    // ----------------------------------------------------------
    const partner =
      booking.hotel?.partner || booking.car?.partner || null
    const partnerStripeAccountId = partner?.stripe_account_id

    // ----------------------------------------------------------
    // สร้างชื่อรายการสินค้า
    // ----------------------------------------------------------
    /** ชื่อสินค้าที่จะแสดงใน Stripe */
    const itemName =
      booking.booking_type === 'HOTEL'
        ? booking.hotel?.name_en || 'Hotel Booking'
        : booking.car?.name_en || 'Car Rental'

    // ----------------------------------------------------------
    // กำหนดสกุลเงินและแปลงราคา
    // ----------------------------------------------------------
    const currency = (booking.currency || 'THB').toLowerCase()
    const amount = Math.round(booking.total_price * 100) // แปลงเป็นหน่วยเล็กที่สุด (สตางค์/เซ็นต์)

    // ----------------------------------------------------------
    // คำนวณ platform fee และ partner payout (ถ้ามี partner)
    // ----------------------------------------------------------
    let paymentIntentData: any = {}
    let applicationFeeAmount: number | undefined

    if (partnerStripeAccountId && partner?.commission_rate) {
      // คำนวณ platform fee (commission rate)
      const commissionRate = partner.commission_rate / 100
      applicationFeeAmount = Math.round(booking.total_price * commissionRate * 100)

      // ตั้งค่า payment intent data สำหรับ Connect
      paymentIntentData = {
        application_fee_amount: applicationFeeAmount,
        on_behalf_of: partnerStripeAccountId,
        transfer_data: {
          destination: partnerStripeAccountId,
        },
      }
    }

    // ----------------------------------------------------------
    // สร้าง Stripe Checkout Session
    // ----------------------------------------------------------
    const sessionConfig: any = {
      // วิธีการชำระเงินที่รองรับ
      payment_method_types: ['card', 'promptpay'],

      // รายการสินค้า
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: itemName,
              description: `Booking: ${booking.booking_code}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],

      // โหมดการชำระ (ครั้งเดียว ไม่ใช่ subscription)
      mode: 'payment',

      // URL สำหรับ redirect
      success_url:
        success_url ||
        `${process.env.NEXT_PUBLIC_APP_URL}/success?code=${booking.booking_code}`,
      cancel_url:
        cancel_url ||
        `${process.env.NEXT_PUBLIC_APP_URL}/booking?cancelled=true`,

      // Metadata สำหรับ webhook
      metadata: {
        booking_id: booking.id,
        booking_code: booking.booking_code,
        ...(partnerStripeAccountId && { partner_account_id: partnerStripeAccountId }),
      },

      // กรอก email ลูกค้าล่วงหน้า
      customer_email: booking.customer_email,
    }

    // เพิ่ม payment intent data ถ้ามี partner (Stripe Connect)
    if (Object.keys(paymentIntentData).length > 0) {
      sessionConfig.payment_intent_data = paymentIntentData
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // ----------------------------------------------------------
    // บันทึก Payment Record
    // ----------------------------------------------------------
    await supabase.from('payments').insert({
      booking_id: booking.id,
      stripe_checkout_session_id: session.id,
      amount: booking.total_price,
      currency: booking.currency || 'THB',
      status: 'PENDING', // รอการชำระ
    })

    // ----------------------------------------------------------
    // ส่งกลับ Session Info
    // ----------------------------------------------------------
    return NextResponse.json({
      session_id: session.id,
      url: session.url, // URL สำหรับ redirect ไปหน้า Stripe Checkout
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
