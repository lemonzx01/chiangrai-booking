export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { BookingType } from '@chiangrai/shared/types'
import { createAdminClient } from '../../../../lib/supabase/server'
import { validateCouponForBooking } from '../../../../lib/coupons'
import { rateLimitAsync } from '../../../../middleware/rate-limit'

export async function POST(request: Request) {
  // ----------------------------------------------------------
  // Rate limit
  // ----------------------------------------------------------
  // Stops this endpoint being a free coupon-code enumeration oracle.
  const limitResponse = await rateLimitAsync(request, '/api/coupons/validate')
  if (limitResponse) return limitResponse

  try {
    const body = await request.json().catch(() => null)
    const code = typeof body?.code === 'string' ? body.code : ''
    const bookingType = body?.booking_type as BookingType
    const totalPrice = Number(body?.total_price)
    // Optional — only required when validating an email-bound
    // coupon (e.g. referral reward). Unbound public coupons
    // ignore this.
    const customerEmail =
      typeof body?.customer_email === 'string' ? body.customer_email : null

    if (!code.trim()) {
      return NextResponse.json(
        { valid: false, error: 'กรุณาระบุโค้ดคูปอง' },
        { status: 400 }
      )
    }

    if (!Object.values(BookingType).includes(bookingType)) {
      return NextResponse.json(
        { valid: false, error: 'ประเภทการจองไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      return NextResponse.json(
        { valid: false, error: 'ยอดชำระไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()
    const result = await validateCouponForBooking(
      supabase,
      code,
      bookingType,
      totalPrice,
      customerEmail
    )

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error })
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: result.coupon.code,
        description: result.coupon.description,
        discount_type: result.coupon.discount_type,
        discount_value: result.coupon.discount_value,
        min_spend: result.coupon.min_spend,
        max_discount: result.coupon.max_discount,
        applies_to: result.coupon.applies_to,
      },
      discount_amount: result.discountAmount,
      final_amount: result.finalAmount,
    })
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

