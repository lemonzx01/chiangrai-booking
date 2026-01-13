/**
 * ============================================================
 * Checkout API Route - สร้าง Omise Charge/Source
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - สร้าง Omise Charge หรือ Source สำหรับการชำระเงิน
 *   - รองรับการชำระด้วยบัตรเครดิต, Internet Banking, TrueMoney, PromptPay
 *   - บันทึกข้อมูล payment ลง database
 *
 * Endpoint:
 *   - POST /api/checkout - สร้าง Charge/Source
 *
 * Request Body:
 *   - booking_id: ID ของการจอง
 *   - payment_method: วิธีการชำระเงิน (card, internet_banking, truemoney, promptpay)
 *   - token: Omise token (สำหรับบัตรเครดิต) - optional
 *   - success_url: URL สำหรับ redirect เมื่อชำระสำเร็จ (optional)
 *   - cancel_url: URL สำหรับ redirect เมื่อยกเลิก (optional)
 *
 * Response:
 *   - charge_id: Omise Charge ID (ถ้าใช้ card)
 *   - source_id: Omise Source ID (ถ้าใช้ internet_banking, truemoney, promptpay)
 *   - authorize_uri: URL สำหรับ authorize (สำหรับ internet_banking, truemoney)
 *   - scannable_code: QR Code สำหรับ PromptPay
 *   - status: สถานะการชำระเงิน
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '../../../lib/supabase/server'

/** Omise client instance */
import { omise, createCharge, createSource } from '../../../lib/omise'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** Error handling utilities */
import {
  handleError,
  handleDatabaseError,
  PaymentError,
  ERROR_MESSAGES,
} from '../../../lib/errors'

/** Security utilities */
import { rateLimitMiddleware, getClientIP } from '../../../middleware/rate-limit'
import { addSecurityHeaders, validateInput, isValidUUID } from '../../../lib/security'

/** Currency conversion */
import { convertCurrencyFromDatabase } from '../../../lib/exchange-rate'
import { Currency } from '@chiangrai/shared/types'

// ============================================================
// POST Handler - สร้าง Omise Charge/Source
// ============================================================

/**
 * สร้าง Omise Charge หรือ Source สำหรับการชำระเงิน
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ดึงข้อมูลการจองจาก database
 *   2. แปลงสกุลเงิน (ถ้าจำเป็น)
 *   3. สร้าง Charge (สำหรับบัตร) หรือ Source (สำหรับ internet_banking, truemoney, promptpay)
 *   4. บันทึก payment record ลง database
 *   5. ส่ง charge/source info กลับให้ client
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} Omise charge/source info
 *
 * @example
 *   POST /api/checkout
 *   Body: {
 *     "booking_id": "uuid-here",
 *     "payment_method": "card",
 *     "token": "tokn_xxx",
 *     "success_url": "https://example.com/success",
 *     "cancel_url": "https://example.com/cancel"
 *   }
 *
 *   Response: {
 *     "charge_id": "chrg_xxx",
 *     "status": "pending"
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

    const { booking_id, payment_method, token, success_url, cancel_url } = body

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

    // ตรวจสอบ payment_method
    const validPaymentMethods = ['card', 'internet_banking', 'truemoney', 'promptpay']
    if (payment_method && !validPaymentMethods.includes(payment_method)) {
      const response = NextResponse.json(
        { error: `Invalid payment_method. Must be one of: ${validPaymentMethods.join(', ')}` },
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
    // ตรวจสอบว่ามีพาร์ทเนอร์หรือไม่ (สำหรับ Omise Recipients)
    // ----------------------------------------------------------
    const partner =
      booking.hotel?.partner || booking.car?.partner || null
    const partnerOmiseRecipientId = partner?.omise_recipient_id

    // ----------------------------------------------------------
    // สร้างชื่อรายการสินค้า
    // ----------------------------------------------------------
    /** ชื่อสินค้าที่จะแสดงใน Omise */
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
        finalAmount = await convertCurrencyFromDatabase(
          booking.total_price,
          Currency.THB,
          bookingCurrency
        )
      } catch (error) {
        console.error('Currency conversion error:', error)
        console.warn(
          `Currency conversion failed for ${bookingCurrency}, using original price`
        )
        finalAmount = booking.total_price
      }
    }
    
    const amount = Math.round(finalAmount * 100) // แปลงเป็นหน่วยเล็กที่สุด (สตางค์/เซ็นต์)

    // ----------------------------------------------------------
    // สร้าง Charge หรือ Source ตาม payment_method
    // ----------------------------------------------------------
    let chargeResult: any = null
    let sourceResult: any = null
    let omiseChargeId: string | null = null
    let omiseSourceId: string | null = null

    const defaultPaymentMethod = payment_method || 'card'

    if (defaultPaymentMethod === 'card') {
      // สำหรับบัตรเครดิต: สร้าง Charge โดยตรง
      if (!token) {
        const response = NextResponse.json(
          { error: 'Token is required for card payment' },
          { status: 400 }
        )
        return addSecurityHeaders(response)
      }

      try {
        chargeResult = await createCharge(
          amount,
          currency,
          token,
          {
            booking_id: booking.id,
            booking_code: booking.booking_code,
            ...(partnerOmiseRecipientId && { partner_recipient_id: partnerOmiseRecipientId }),
          }
        )

        omiseChargeId = chargeResult.id
      } catch (error: any) {
        console.error('Omise charge creation error:', error)
        const response = NextResponse.json(
          { error: error.message || 'Failed to create charge' },
          { status: 500 }
        )
        return addSecurityHeaders(response)
      }
    } else {
      // สำหรับ Internet Banking, TrueMoney, PromptPay: สร้าง Source ก่อน
      let sourceType = ''
      switch (defaultPaymentMethod) {
        case 'internet_banking':
          sourceType = 'internet_banking_thb'
          break
        case 'truemoney':
          sourceType = 'truemoney'
          break
        case 'promptpay':
          sourceType = 'promptpay'
          break
        default:
          const response = NextResponse.json(
            { error: `Unsupported payment method: ${defaultPaymentMethod}` },
            { status: 400 }
          )
          return addSecurityHeaders(response)
      }

      try {
        sourceResult = await createSource(amount, currency, sourceType)
        omiseSourceId = sourceResult.id

        // สร้าง Charge จาก Source
        chargeResult = await createCharge(
          amount,
          currency,
          sourceResult.id,
          {
            booking_id: booking.id,
            booking_code: booking.booking_code,
            ...(partnerOmiseRecipientId && { partner_recipient_id: partnerOmiseRecipientId }),
          }
        )

        omiseChargeId = chargeResult.id
      } catch (error: any) {
        console.error('Omise source/charge creation error:', error)
        const response = NextResponse.json(
          { error: error.message || 'Failed to create source/charge' },
          { status: 500 }
        )
        return addSecurityHeaders(response)
      }
    }

    // ----------------------------------------------------------
    // บันทึก Payment Record
    // ----------------------------------------------------------
    try {
      const { error: paymentError } = await supabase.from('payments').insert({
        booking_id: booking.id,
        omise_charge_id: omiseChargeId,
        omise_source_id: omiseSourceId,
        amount: booking.total_price,
        currency: booking.currency || 'THB',
        status: chargeResult.status === 'successful' ? 'SUCCEEDED' : 'PENDING',
      })

      if (paymentError) {
        console.error('Payment record creation error:', paymentError)
      }
    } catch (error) {
      console.error('Database error when creating payment record:', error)
    }

    // ----------------------------------------------------------
    // ส่งกลับ Charge/Source Info
    // ----------------------------------------------------------
    const responseData: any = {
      charge_id: omiseChargeId,
      status: chargeResult.status,
    }

    // เพิ่ม source info ถ้ามี
    if (omiseSourceId) {
      responseData.source_id = omiseSourceId
    }

    // เพิ่ม authorize_uri สำหรับ internet_banking และ truemoney
    if (sourceResult?.authorize_uri) {
      responseData.authorize_uri = sourceResult.authorize_uri
    }

    // เพิ่ม scannable_code สำหรับ PromptPay
    if (sourceResult?.scannable_code) {
      responseData.scannable_code = sourceResult.scannable_code
    }

    const response = NextResponse.json(responseData)
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Checkout error:', error)
    const errorMessage = handleError(error, ERROR_MESSAGES.PAYMENT_CREATE_FAILED)
    const response = NextResponse.json({ error: errorMessage }, { status: 500 })
    return addSecurityHeaders(response)
  }
}
