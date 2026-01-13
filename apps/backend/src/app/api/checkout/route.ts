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
import { createAdminClient } from '../../../lib/supabase/server'

/** Stripe client instance */
import { stripe } from '../../../lib/stripe'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** Error handling utilities */
import {
  handleError,
  handleStripeError,
  handleDatabaseError,
  PaymentError,
  ERROR_MESSAGES,
} from '../../../lib/errors'

/** Security utilities */
import { rateLimitMiddleware, getClientIP } from '../../../middleware/rate-limit'
import { addSecurityHeaders, validateInput, isValidUUID } from '../../../lib/security'

/** Currency conversion */
import { convertCurrencyWithAPI } from '../../../lib/currency'
import { Currency } from '@chiangrai/shared/types'

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
    // ----------------------------------------------------------
    // Rate Limiting
    // ----------------------------------------------------------
    const rateLimitResponse = rateLimitMiddleware(request, '/api/checkout')
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse)
    }

    // ----------------------------------------------------------
    // Input Validation
    // ----------------------------------------------------------
    let body
    try {
      body = await request.json()
    } catch (error) {
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_INVALID_DATA },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    const { booking_id, success_url, cancel_url } = body

    // ตรวจสอบว่ามี booking_id หรือไม่
    if (!booking_id) {
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_MISSING_FIELD + ': booking_id' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // ตรวจสอบว่า booking_id เป็น UUID หรือไม่
    if (!isValidUUID(booking_id)) {
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_INVALID_DATA + ': Invalid booking_id format' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // Validate URLs (ถ้ามี)
    if (success_url && !validateInput(success_url)) {
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_INVALID_DATA + ': Invalid success_url' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    if (cancel_url && !validateInput(cancel_url)) {
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_INVALID_DATA + ': Invalid cancel_url' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

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
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.PAYMENT_INVALID_BOOKING },
        { status: 404 }
      )
      return addSecurityHeaders(response)
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
    const bookingCurrency = (booking.currency || 'THB') as Currency
    const currency = bookingCurrency.toLowerCase()
    
    // แปลงราคาเป็นสกุลเงินที่เลือก (ถ้าไม่ใช่ THB)
    let finalAmount = booking.total_price
    if (bookingCurrency !== Currency.THB) {
      // แปลงจาก THB เป็นสกุลเงินที่เลือก
      try {
        finalAmount = await convertCurrencyWithAPI(
          booking.total_price,
          Currency.THB,
          bookingCurrency
        )
      } catch (error) {
        console.error('Currency conversion error:', error)
        // ถ้าแปลงสกุลเงินไม่สำเร็จ ให้ใช้ราคาเดิมและแจ้งเตือน
        // แต่ยังคงดำเนินการต่อได้
        console.warn(
          `Currency conversion failed for ${bookingCurrency}, using original price`
        )
        finalAmount = booking.total_price
      }
    }
    
    const amount = Math.round(finalAmount * 100) // แปลงเป็นหน่วยเล็กที่สุด (สตางค์/เซ็นต์)

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
      payment_method_types: ['card', 'promptpay', 'paypal'],

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
      
      // รองรับบัตรจากทุกประเทศ
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    }

    // เพิ่ม payment intent data ถ้ามี partner (Stripe Connect)
    if (Object.keys(paymentIntentData).length > 0) {
      sessionConfig.payment_intent_data = paymentIntentData
    }

    // ----------------------------------------------------------
    // สร้าง Stripe Checkout Session
    // ----------------------------------------------------------
    let session
    try {
      session = await stripe.checkout.sessions.create(sessionConfig)
    } catch (error) {
      console.error('Stripe checkout session creation error:', error)
      const errorMessage = handleStripeError(error)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // ----------------------------------------------------------
    // บันทึก Payment Record
    // ----------------------------------------------------------
    try {
      const { error: paymentError } = await supabase.from('payments').insert({
        booking_id: booking.id,
        stripe_checkout_session_id: session.id,
        amount: booking.total_price,
        currency: booking.currency || 'THB',
        status: 'PENDING', // รอการชำระ
      })

      if (paymentError) {
        console.error('Payment record creation error:', paymentError)
        // แม้ว่าบันทึก payment record จะล้มเหลว แต่ session ถูกสร้างแล้ว
        // ยังคงส่ง session กลับไป แต่ log error ไว้
      }
    } catch (error) {
      console.error('Database error when creating payment record:', error)
      // ยังคงส่ง session กลับไป
    }

    // ----------------------------------------------------------
    // ส่งกลับ Session Info
    // ----------------------------------------------------------
    const response = NextResponse.json({
      session_id: session.id,
      url: session.url, // URL สำหรับ redirect ไปหน้า Stripe Checkout
    })
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Checkout error:', error)
    const errorMessage = handleError(error, ERROR_MESSAGES.PAYMENT_CREATE_FAILED)
    const response = NextResponse.json({ error: errorMessage }, { status: 500 })
    return addSecurityHeaders(response)
  }
}
