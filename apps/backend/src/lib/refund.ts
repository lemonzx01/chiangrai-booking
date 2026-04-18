import { getStripe } from './stripe'

/**
 * นโยบายคืนเงิน (Tiered Refund Policy)
 * - 7+ วันก่อน check-in -> คืน 100%
 * - 3-7 วันก่อน check-in -> คืน 50%
 * - <3 วันก่อน check-in -> ไม่คืน (0%)
 */

/**
 * คำนวณส่วนต่างเป็น "calendar days" โดยตัด time-of-day ทิ้ง
 *
 * แก้ปัญหา timezone/midnight crossing:
 *   - ก่อนหน้านี้ใช้ Math.ceil((checkIn - now) / msPerDay)
 *     ซึ่งจะนับเศษชั่วโมงเป็น 1 วันเต็ม → 6.1 วันกลายเป็น 7
 *   - วิธีใหม่: ปัด check-in ไปต้นวัน, ปัด now ไปต้นวันเช่นกัน
 *     แล้วลบกัน → ไม่ขึ้นกับเวลาในวัน
 */
function differenceInCalendarDays(later: Date, earlier: Date): number {
  // Use UTC to avoid local-time DST shifts.
  const utcLater = Date.UTC(
    later.getUTCFullYear(),
    later.getUTCMonth(),
    later.getUTCDate()
  )
  const utcEarlier = Date.UTC(
    earlier.getUTCFullYear(),
    earlier.getUTCMonth(),
    earlier.getUTCDate()
  )
  return Math.round((utcLater - utcEarlier) / (1000 * 60 * 60 * 24))
}

export function calculateRefundPercentage(checkInDate: string): number {
  const now = new Date()
  // checkInDate is a DATE string (YYYY-MM-DD); parsing as ISO with no time
  // gives us 00:00:00 UTC, which is exactly what we want here.
  const checkIn = new Date(checkInDate)
  const diffDays = differenceInCalendarDays(checkIn, now)

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
