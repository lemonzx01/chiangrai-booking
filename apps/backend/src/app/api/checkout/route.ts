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

export const dynamic = 'force-dynamic'

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
import { rateLimitAsync, getClientIP } from '../../../middleware/rate-limit'
import { addSecurityHeaders, validateInput, isValidUUID } from '../../../lib/security'

/** Currency conversion */
import { convertCurrencyAmount } from '../../../lib/exchange-rate'
import { BookingType, Currency } from '@chiangrai/shared/types'
import { validateCouponForBooking } from '../../../lib/coupons'
import { logger } from '../../../lib/logger'

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
    const rateLimitResponse = await rateLimitAsync(request, '/api/checkout')
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
        { error: 'ไม่สามารถอ่านข้อมูลได้ กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    const { booking_id, payment_method, success_url, cancel_url, coupon_code } = body

    // ตรวจสอบว่ามี booking_id หรือไม่
    if (!booking_id) {
      const response = NextResponse.json(
        { error: 'ไม่พบรหัสการจอง (booking_id) กรุณากลับไปเลือกการจองใหม่' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // ตรวจสอบว่า booking_id เป็น UUID หรือไม่
    if (!isValidUUID(booking_id)) {
      const response = NextResponse.json(
        { error: 'รหัสการจองไม่ถูกต้อง กรุณากลับไปเลือกการจองใหม่' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // Validate URLs (ถ้ามี)
    if (success_url && !validateInput(success_url)) {
      const response = NextResponse.json(
        { error: 'URL สำหรับ redirect ไม่ถูกต้อง' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    if (cancel_url && !validateInput(cancel_url)) {
      const response = NextResponse.json(
        { error: 'URL สำหรับ redirect ไม่ถูกต้อง' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // สร้าง Supabase Admin client
    const supabase = await createAdminClient()

    // ----------------------------------------------------------
    // ดึงข้อมูลการจองพร้อม hotel/car information
    // ----------------------------------------------------------
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, hotel:hotels(*), car:cars(*)')
      .eq('id', booking_id)
      .single()

    // ตรวจสอบว่าพบการจองหรือไม่
    if (bookingError || !booking) {
      logger.error('Booking query error', { error: bookingError })
      const response = NextResponse.json(
        { error: 'ไม่พบข้อมูลการจองนี้ในระบบ อาจถูกยกเลิกไปแล้ว กรุณาทำการจองใหม่' },
        { status: 404 }
      )
      return addSecurityHeaders(response)
    }

    // ----------------------------------------------------------
    // ตรวจสอบสถานะการจอง - ชำระเงินได้เฉพาะ PENDING, CONFIRMED
    // ----------------------------------------------------------
    const payableStatuses = ['PENDING', 'CONFIRMED']
    if (!payableStatuses.includes(booking.status)) {
      let statusMessage = 'การจองนี้ไม่สามารถชำระเงินได้'
      if (booking.status === 'CANCELLED') {
        statusMessage = 'การจองนี้ถูกยกเลิกแล้ว ไม่สามารถชำระเงินได้'
      } else if (booking.status === 'PAID') {
        statusMessage = 'การจองนี้ได้ชำระเงินเรียบร้อยแล้ว'
      } else if (booking.status === 'COMPLETED') {
        statusMessage = 'การจองนี้เสร็จสิ้นแล้ว'
      }
      const response = NextResponse.json(
        { error: statusMessage },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // ----------------------------------------------------------
    // ดึงข้อมูล partner (ถ้ามี) สำหรับ Stripe Connect
    // ----------------------------------------------------------
    let partner: any = null
    const partnerId = booking.hotel?.partner_id || booking.car?.partner_id
    if (partnerId) {
      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single()
      partner = partnerData
    }
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
    // ตรวจสอบราคา
    // ----------------------------------------------------------
    if (!booking.total_price || booking.total_price <= 0) {
      logger.error('Invalid total_price', { totalPrice: booking.total_price, bookingId: booking.id })
      const response = NextResponse.json(
        { error: `ราคาการจองไม่ถูกต้อง (${booking.total_price || 0} บาท) กรุณาทำการจองใหม่` },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    const originalAmount = Number(booking.total_price)
    let discountAmount = 0
    let appliedCouponCode: string | null = null

    if (typeof coupon_code === 'string' && coupon_code.trim()) {
      const couponValidation = await validateCouponForBooking(
        supabase,
        coupon_code,
        booking.booking_type as BookingType,
        originalAmount,
        // Pass through the booking's customer_email so email-bound
        // referral coupons match against the actual buyer.
        booking.customer_email || null
      )

      if (!couponValidation.valid) {
        const response = NextResponse.json(
          { error: couponValidation.error },
          { status: 400 }
        )
        return addSecurityHeaders(response)
      }

      discountAmount = couponValidation.discountAmount
      appliedCouponCode = couponValidation.coupon.code
    }

    const payableAmountThb = Math.round((originalAmount - discountAmount) * 100) / 100
    if (payableAmountThb <= 0) {
      const response = NextResponse.json(
        { error: 'ยอดชำระไม่ถูกต้องหลังหักส่วนลด' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // ----------------------------------------------------------
    // กำหนดสกุลเงินและแปลงราคา
    // ----------------------------------------------------------
    const bookingCurrency = (booking.currency || 'THB') as Currency
    const currency = bookingCurrency.toLowerCase()

    // แปลงราคาเป็นสกุลเงินที่เลือก (ถ้าไม่ใช่ THB)
    let finalAmount = payableAmountThb
    if (bookingCurrency !== Currency.THB) {
      // แปลงจาก THB เป็นสกุลเงินที่เลือก
      try {
        finalAmount = await convertCurrencyAmount(
          payableAmountThb,
          Currency.THB,
          bookingCurrency
        )
      } catch (error) {
        logger.error('Currency conversion error', { error })
        logger.warn('Currency conversion failed, using original price', { bookingCurrency })
        finalAmount = payableAmountThb
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
      applicationFeeAmount = Math.round(payableAmountThb * commissionRate * 100)

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
    // กำหนด payment methods ตามการเลือกของผู้ใช้หรือสกุลเงิน
    let paymentMethods: string[]
    if (payment_method === 'promptpay' && currency === 'thb') {
      paymentMethods = ['promptpay']
    } else if (payment_method === 'paypal') {
      paymentMethods = ['paypal']
    } else if (payment_method === 'card') {
      paymentMethods = ['card']
    } else {
      // default: card + paypal + promptpay (ถ้าเป็น THB)
      paymentMethods = ['card', 'paypal']
      if (currency === 'thb') {
        paymentMethods.push('promptpay')
      }
    }

    const sessionConfig: any = {
      // วิธีการชำระเงินที่รองรับ (dynamic ตามสกุลเงิน)
      payment_method_types: paymentMethods,

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
        `${process.env.NEXT_PUBLIC_APP_URL}/success?code=${booking.booking_code}&email=${encodeURIComponent(booking.customer_email)}`,
      cancel_url:
        cancel_url ||
        `${process.env.NEXT_PUBLIC_APP_URL}/checkout?booking_code=${booking.booking_code}&email=${encodeURIComponent(booking.customer_email)}`,

      // Metadata สำหรับ webhook
      metadata: {
        booking_id: booking.id,
        booking_code: booking.booking_code,
        original_amount: String(originalAmount),
        discount_amount: String(discountAmount),
        ...(appliedCouponCode && { coupon_code: appliedCouponCode }),
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
    // Debug: แสดงข้อมูลที่จะส่งไป Stripe
    logger.info('[Checkout] Creating Stripe session', {
      payment_method_types: sessionConfig.payment_method_types,
      amount: sessionConfig.line_items?.[0]?.price_data?.unit_amount,
      currency: sessionConfig.line_items?.[0]?.price_data?.currency,
      customer_email: sessionConfig.customer_email,
      success_url: sessionConfig.success_url,
      cancel_url: sessionConfig.cancel_url,
      has_connect: !!sessionConfig.payment_intent_data,
    })

    let session
    try {
      session = await stripe.checkout.sessions.create(sessionConfig)
    } catch (error: any) {
      logger.error('Stripe checkout session creation error', { error })
      // ส่ง error ที่เข้าใจง่ายกลับไป
      let errorMsg = 'ไม่สามารถเชื่อมต่อระบบชำระเงินได้'
      if (error?.type === 'StripeInvalidRequestError') {
        if (error.message?.includes('payment_method_types')) {
          errorMsg = `วิธีชำระเงินที่เลือก (${payment_method || 'ไม่ระบุ'}) ไม่รองรับสกุลเงิน ${bookingCurrency} กรุณาเลือกวิธีอื่น`
        } else if (error.message?.includes('currency')) {
          errorMsg = `สกุลเงิน ${bookingCurrency} ไม่รองรับวิธีชำระเงินนี้ กรุณาเลือกวิธีอื่น`
        } else {
          errorMsg = `ข้อมูลการชำระเงินไม่ถูกต้อง: ${error.message}`
        }
      } else if (error?.type === 'StripeConnectionError') {
        errorMsg = 'ไม่สามารถเชื่อมต่อ Stripe ได้ กรุณาลองใหม่ในอีกสักครู่'
      } else if (error?.type === 'StripeAuthenticationError') {
        errorMsg = 'เกิดข้อผิดพลาดในการตั้งค่าระบบชำระเงิน กรุณาติดต่อผู้ดูแลระบบ'
      }
      const response = NextResponse.json({ error: errorMsg }, { status: 500 })
      return addSecurityHeaders(response)
    }

    // ----------------------------------------------------------
    // บันทึก Payment Record
    // ----------------------------------------------------------
    try {
      // currency_type enum ใน DB รองรับเฉพาะ THB, USD, EUR
      const paymentCurrency: 'THB' | 'USD' | 'EUR' =
        bookingCurrency === Currency.USD
          ? 'USD'
          : bookingCurrency === Currency.EUR
            ? 'EUR'
            : 'THB'

      const { error: paymentError } = await supabase.from('payments').insert({
        booking_id: booking.id,
        stripe_checkout_session_id: session.id,
        amount: payableAmountThb,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        coupon_code: appliedCouponCode,
        currency: paymentCurrency,
        status: 'PENDING', // รอการชำระ
      })

      if (paymentError) {
        logger.error('Payment record creation error', { error: paymentError })
      }
    } catch (error) {
      logger.error('Database error when creating payment record', { error })
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
    logger.error('Checkout error', { error })
    const response = NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน กรุณาลองใหม่อีกครั้ง หากปัญหายังคงอยู่ กรุณาติดต่อเรา' },
      { status: 500 }
    )
    return addSecurityHeaders(response)
  }
}
