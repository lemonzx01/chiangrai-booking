/**
 * ============================================================
 * Omise Webhook API Route - รับ Event จาก Omise
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - รับและประมวลผล Webhook events จาก Omise
 *   - อัพเดทสถานะการชำระเงินและการจอง
 *   - ส่งอีเมลยืนยันเมื่อชำระเงินสำเร็จ
 *
 * Endpoint:
 *   - POST /api/webhook/omise - รับ Omise webhook events
 *
 * Events ที่รองรับ:
 *   - charge.create: สร้าง charge ใหม่
 *   - charge.complete: ชำระเงินสำเร็จ
 *   - charge.failure: การชำระล้มเหลว
 *   - source.chargeable: Source พร้อมชำระเงิน
 *
 * Security:
 *   - ตรวจสอบ Omise Signature เพื่อป้องกัน request ปลอม
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Omise client instance */
import { getOmise } from '../../../../lib/omise'

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '../../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันดึง headers จาก request */
import { headers } from 'next/headers'

/** บริการส่งอีเมลยืนยันการจอง */
import { sendBookingConfirmationEmail } from '../../../../services/notifications/email'

// ============================================================
// POST Handler - รับ Omise Webhook Events
// ============================================================

/**
 * รับและประมวลผล Webhook events จาก Omise
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบ Omise Signature เพื่อยืนยันว่า request มาจาก Omise จริง
 *   2. ประมวลผลตาม event type:
 *      - charge.complete: อัพเดทสถานะเป็น SUCCEEDED และ PAID
 *      - charge.failure: อัพเดทสถานะเป็น FAILED
 *      - source.chargeable: สร้าง charge จาก source
 *   3. ส่งอีเมลยืนยันเมื่อชำระเงินสำเร็จ
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} สถานะการรับ webhook
 *
 * @example
 *   // Omise จะส่ง request มาเมื่อมี event เกิดขึ้น
 *   POST /api/webhook/omise
 *   Headers: { "x-omise-signature": "xxx" }
 */
export async function POST(request: Request) {
  // ดึง body เป็น text (Omise ต้องการ raw body)
  const body = await request.text()

  // ดึง Omise signature จาก headers
  const headersList = await headers()
  const signature = headersList.get('x-omise-signature')

  // ----------------------------------------------------------
  // ตรวจสอบ Signature
  // ----------------------------------------------------------
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // ตรวจสอบ signature ด้วย Omise
  const omise = getOmise()
  let event: any

  try {
    // Omise ใช้ HMAC SHA256 สำหรับ signature verification
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', process.env.OMISE_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Parse event data
    event = JSON.parse(body)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ----------------------------------------------------------
  // ประมวลผลตาม Event Type
  // ----------------------------------------------------------
  const supabase = await createAdminClient()

  try {
    switch (event.key) {
      // Case: Charge Complete (ชำระเงินสำเร็จ)
      case 'charge.complete': {
        const charge = event.data

        // อัพเดท payment status
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'SUCCEEDED',
            paid_at: new Date().toISOString(),
            omise_payment_intent_id: charge.id,
          })
          .eq('omise_charge_id', charge.id)

        if (paymentError) {
          console.error('Error updating payment:', paymentError)
          break
        }

        // ดึงข้อมูล payment เพื่ออัพเดท booking
        const { data: payment } = await supabase
          .from('payments')
          .select('booking_id, booking:bookings(*)')
          .eq('omise_charge_id', charge.id)
          .single()

        if (payment && payment.booking) {
          // อัพเดท booking status
          await supabase
            .from('bookings')
            .update({ status: 'PAID' })
            .eq('id', payment.booking_id)

          // ส่งอีเมลยืนยัน
          try {
            await sendBookingConfirmationEmail(payment.booking)
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError)
          }
        }

        break
      }

      // Case: Charge Failure (การชำระล้มเหลว)
      case 'charge.failure': {
        const charge = event.data

        // อัพเดท payment status
        await supabase
          .from('payments')
          .update({ status: 'FAILED' })
          .eq('omise_charge_id', charge.id)

        break
      }

      // Case: Source Chargeable (Source พร้อมชำระเงิน)
      case 'source.chargeable': {
        const source = event.data

        // ดึงข้อมูล payment ที่เกี่ยวข้อง
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('omise_source_id', source.id)
          .single()

        if (payment) {
          // สร้าง charge จาก source
          try {
            const charge = await omise.charges.create({
              amount: payment.amount * 100, // แปลงเป็นสตางค์
              currency: payment.currency.toLowerCase(),
              source: source.id,
              metadata: {
                booking_id: payment.booking_id,
              },
            })

            // อัพเดท payment ด้วย charge id
            await supabase
              .from('payments')
              .update({ omise_charge_id: charge.id })
              .eq('id', payment.id)
          } catch (chargeError) {
            console.error('Error creating charge from source:', chargeError)
          }
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.key}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
