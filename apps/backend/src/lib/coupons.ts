import { BookingType } from '@chiangrai/shared/types'

type CouponScope = 'ALL' | 'HOTEL' | 'CAR'
type CouponDiscountType = 'PERCENT' | 'FIXED'

interface CouponRecord {
  id: string
  code: string
  description: string | null
  discount_type: CouponDiscountType
  discount_value: number
  min_spend: number
  max_discount: number | null
  applies_to: CouponScope
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  /**
   * If set, only a booking whose customer_email matches
   * (case-insensitive) can redeem this coupon. Used by the
   * referral reward flow to scope auto-issued coupons to the
   * intended recipient. NULL = traditional public coupon.
   */
  bound_to_email?: string | null
  /**
   * Provenance tag — e.g. 'referral_referrer' / 'referral_referee'.
   * NULL for admin-issued promo codes.
   */
  source?: string | null
}

export type CouponValidationResult =
  | {
      valid: true
      coupon: CouponRecord
      discountAmount: number
      finalAmount: number
    }
  | {
      valid: false
      error: string
    }

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}

export function calculateCouponDiscount(
  coupon: Pick<CouponRecord, 'discount_type' | 'discount_value' | 'max_discount'>,
  amount: number
): number {
  if (amount <= 0) {
    return 0
  }

  let discount =
    coupon.discount_type === 'PERCENT'
      ? (amount * coupon.discount_value) / 100
      : coupon.discount_value

  if (coupon.discount_type === 'PERCENT' && coupon.max_discount !== null) {
    discount = Math.min(discount, coupon.max_discount)
  }

  return roundTo2(Math.max(0, Math.min(discount, amount)))
}

export async function validateCouponForBooking(
  supabase: any,
  rawCode: string,
  bookingType: BookingType,
  totalAmount: number,
  /**
   * Optional. When provided AND the coupon has bound_to_email
   * set, the booking's customer_email must match (case-
   * insensitive) or the redemption is rejected.
   *
   * Pass undefined for "we don't know the customer email yet" —
   * the validation will still pass for unbound coupons but
   * reject any bound coupon, which is the safe default.
   */
  customerEmail?: string | null
): Promise<CouponValidationResult> {
  const code = normalizeCouponCode(rawCode)

  if (!code) {
    return { valid: false, error: 'กรุณาระบุโค้ดคูปอง' }
  }

  if (totalAmount <= 0) {
    return { valid: false, error: 'ยอดชำระไม่ถูกต้อง' }
  }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .ilike('code', code)
    .single()

  if (error || !coupon) {
    return { valid: false, error: 'ไม่พบคูปองนี้' }
  }

  const couponRecord = coupon as CouponRecord

  if (!couponRecord.is_active) {
    return { valid: false, error: 'คูปองนี้ถูกปิดใช้งาน' }
  }

  const now = new Date()
  if (couponRecord.starts_at && now < new Date(couponRecord.starts_at)) {
    return { valid: false, error: 'คูปองนี้ยังไม่เริ่มใช้งาน' }
  }

  if (couponRecord.expires_at && now > new Date(couponRecord.expires_at)) {
    return { valid: false, error: 'คูปองนี้หมดอายุแล้ว' }
  }

  if (
    couponRecord.applies_to !== 'ALL' &&
    couponRecord.applies_to !== bookingType
  ) {
    return { valid: false, error: 'คูปองนี้ใช้กับการจองประเภทนี้ไม่ได้' }
  }

  // Email-bound check — used by referral reward coupons. If the
  // coupon is bound but the caller didn't provide an email, or
  // the email doesn't match, reject. Comparison is case-
  // insensitive because email addresses are.
  if (couponRecord.bound_to_email) {
    const expected = couponRecord.bound_to_email.trim().toLowerCase()
    const actual = (customerEmail || '').trim().toLowerCase()
    if (!actual || expected !== actual) {
      return {
        valid: false,
        error: 'คูปองนี้ใช้ได้เฉพาะอีเมลที่ได้รับสิทธิ์เท่านั้น',
      }
    }
  }

  if (totalAmount < couponRecord.min_spend) {
    return {
      valid: false,
      error: `ใช้คูปองได้เมื่อมียอดขั้นต่ำ ${couponRecord.min_spend.toLocaleString()} บาท`,
    }
  }

  const discountAmount = calculateCouponDiscount(couponRecord, totalAmount)
  if (discountAmount <= 0) {
    return { valid: false, error: 'คูปองนี้ไม่สามารถใช้งานได้กับยอดปัจจุบัน' }
  }

  return {
    valid: true,
    coupon: couponRecord,
    discountAmount,
    finalAmount: roundTo2(totalAmount - discountAmount),
  }
}

