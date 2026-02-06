import { getStripe } from './stripe'

/**
 * นโยบายคืนเงิน (Tiered Refund Policy)
 * - 7+ วันก่อน check-in -> คืน 100%
 * - 3-7 วันก่อน check-in -> คืน 50%
 * - <3 วันก่อน check-in -> ไม่คืน (0%)
 */
export function calculateRefundPercentage(checkInDate: string): number {
  const now = new Date()
  const checkIn = new Date(checkInDate)
  const diffMs = checkIn.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays >= 7) return 100
  if (diffDays >= 3) return 50
  return 0
}

/**
 * คำนวณจำนวนเงินคืน
 */
export function calculateRefundAmount(totalPrice: number, percentage: number): number {
  return Math.round((totalPrice * percentage) / 100 * 100) / 100
}

/**
 * เรียก Stripe Refund API
 * @returns refund ID และ status
 */
export async function processStripeRefund(
  paymentIntentId: string,
  amountInSatang: number
): Promise<{ refundId: string; status: string }> {
  const stripe = getStripe()

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountInSatang, // Stripe ใช้หน่วยย่อย (สตางค์สำหรับ THB)
  })

  return {
    refundId: refund.id,
    status: refund.status || 'pending',
  }
}
