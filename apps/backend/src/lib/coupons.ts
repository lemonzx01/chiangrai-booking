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
  totalAmount: number
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

