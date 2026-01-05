/**
 * ============================================================
 * Bookings API Route - จัดการข้อมูลการจอง
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงรายการการจองทั้งหมด (เฉพาะ Admin)
 *   - POST: สร้างการจองใหม่
 *
 * Endpoints:
 *   - GET  /api/bookings - ดึงรายการการจอง (รองรับ pagination และ filter)
 *   - POST /api/bookings - สร้างการจองใหม่
 *
 * Query Parameters (GET):
 *   - limit: จำนวนรายการต่อหน้า (default: 10)
 *   - offset: ตำแหน่งเริ่มต้น (default: 0)
 *   - status: กรองตามสถานะการจอง
 *
 * Features:
 *   - สร้างรหัสการจองอัตโนมัติ
 *   - คำนวณราคารวมจากจำนวนคืน/วัน
 *   - ส่งแจ้งเตือนผ่าน LINE เมื่อมีการจองใหม่
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '@/lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** บริการแจ้งเตือนผ่าน LINE */
import { sendLineNotification } from '@/services/notifications/line'

/** บริการส่งอีเมลแจ้งเตือนพาร์ทเนอร์ */
import {
  sendHotelPartnerNotification,
  sendDriverPartnerNotification,
} from '@/services/notifications/email'

/** ฟังก์ชัน Utility สำหรับการจอง */
import { generateBookingCode, calculateNights, calculateTotalPrice } from '@/lib/utils'

// ============================================================
// GET Handler - ดึงรายการการจอง
// ============================================================

/**
 * ดึงรายการการจองทั้งหมด (สำหรับ Admin)
 *
 * @description
 *   - ดึงข้อมูลการจองพร้อมข้อมูลโรงแรมและรถเช่าที่เกี่ยวข้อง
 *   - รองรับ pagination ด้วย limit และ offset
 *   - รองรับการกรองตามสถานะ (status)
 *   - เรียงตามวันที่สร้างล่าสุดก่อน
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} รายการการจองพร้อมข้อมูล pagination
 *
 * @example
 *   // ดึงการจอง 10 รายการแรก
 *   GET /api/bookings
 *
 *   // กรองเฉพาะการจองที่รอดำเนินการ
 *   GET /api/bookings?status=PENDING
 */
export async function GET(request: Request) {
  try {
    // สร้าง Supabase Admin client (ข้าม RLS)
    const supabase = await createAdminClient()

    // ดึง query parameters จาก URL
    const { searchParams } = new URL(request.url)

    // ----------------------------------------------------------
    // ตั้งค่า Pagination
    // ----------------------------------------------------------
    /** จำนวนรายการต่อหน้า (default: 10) */
    const limit = parseInt(searchParams.get('limit') || '10')

    /** ตำแหน่งเริ่มต้น (default: 0) */
    const offset = parseInt(searchParams.get('offset') || '0')

    /** ตัวกรองสถานะ (optional) */
    const status = searchParams.get('status')

    // ----------------------------------------------------------
    // สร้าง Query พร้อม JOIN กับตารางโรงแรมและรถเช่า
    // ----------------------------------------------------------
    let query = supabase
      .from('bookings')
      .select(
        '*, hotel:hotels(*, partner:partners(*)), car:cars(*, partner:partners(*)), room_type:room_types(*)',
        { count: 'exact' }
      ) // JOIN ข้อมูลที่เกี่ยวข้อง
      .order('created_at', { ascending: false }) // เรียงจากใหม่ไปเก่า

    // เพิ่มตัวกรองสถานะ (ถ้ามี)
    if (status) {
      query = query.eq('status', status)
    }

    // ----------------------------------------------------------
    // ดึงข้อมูลพร้อม Pagination
    // ----------------------------------------------------------
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ส่งกลับข้อมูลพร้อม pagination info
    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// POST Handler - สร้างการจองใหม่
// ============================================================

/**
 * สร้างการจองใหม่ในระบบ
 *
 * @description
 *   - สร้างรหัสการจองอัตโนมัติ (format: BK-XXXXXX)
 *   - คำนวณราคารวมจากราคาต่อคืน/วัน x จำนวนคืน
 *   - บันทึกการจองพร้อมข้อมูลที่เกี่ยวข้อง
 *   - ส่งแจ้งเตือนผ่าน LINE แบบ non-blocking
 *
 * @param {Request} request - HTTP Request พร้อม body เป็นข้อมูลการจอง
 * @returns {Promise<NextResponse>} ข้อมูลการจองที่สร้างใหม่
 *
 * @example
 *   POST /api/bookings
 *   Body: {
 *     "booking_type": "HOTEL",
 *     "hotel_id": "uuid-here",
 *     "check_in_date": "2024-01-15",
 *     "check_out_date": "2024-01-17",
 *     "customer_name": "สมชาย ใจดี",
 *     ...
 *   }
 */
export async function POST(request: Request) {
  try {
    // สร้าง Supabase Admin client
    const supabase = await createAdminClient()

    // ดึงข้อมูลจาก request body
    const body = await request.json()

    // ----------------------------------------------------------
    // สร้างรหัสการจอง
    // ----------------------------------------------------------
    /** รหัสการจองอัตโนมัติ เช่น BK-ABC123 */
    const booking_code = generateBookingCode()

    // ----------------------------------------------------------
    // คำนวณราคารวม
    // ----------------------------------------------------------
    let total_price = body.total_price

    // ถ้าไม่ได้ระบุราคามา ให้คำนวณจากข้อมูลโรงแรม/รถเช่า
    if (!total_price) {
      /** จำนวนคืน/วัน */
      const nights = calculateNights(body.check_in_date, body.check_out_date)

      // กรณีจองโรงแรม
      if (body.booking_type === 'HOTEL' && body.hotel_id) {
        const { data: hotel } = await supabase
          .from('hotels')
          .select('price_per_night')
          .eq('id', body.hotel_id)
          .single()
        total_price = hotel ? calculateTotalPrice(hotel.price_per_night, nights) : 0
      }
      // กรณีเช่ารถ
      else if (body.booking_type === 'CAR' && body.car_id) {
        const { data: car } = await supabase
          .from('cars')
          .select('price_per_day')
          .eq('id', body.car_id)
          .single()
        total_price = car ? calculateTotalPrice(car.price_per_day, nights) : 0
      }
    }

    // ----------------------------------------------------------
    // บันทึกการจองลง Database
    // ----------------------------------------------------------
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        ...body,
        booking_code,
        total_price,
        currency: body.currency || 'THB', // ใช้สกุลเงินที่ระบุ หรือ THB เป็นค่าเริ่มต้น
        status: 'PENDING', // สถานะเริ่มต้น: รอดำเนินการ
      })
      .select(
        '*, hotel:hotels(*, partner:partners(*)), car:cars(*, partner:partners(*)), room_type:room_types(*)'
      )
      .single()

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ----------------------------------------------------------
    // ส่งแจ้งเตือน LINE (non-blocking)
    // ----------------------------------------------------------
    // ใช้ .catch เพื่อไม่ให้ error ของ LINE กระทบการจอง
    sendLineNotification(booking).catch(console.error)

    // ----------------------------------------------------------
    // ส่งอีเมลแจ้งเตือนพาร์ทเนอร์ (non-blocking)
    // ----------------------------------------------------------
    // ส่งอีเมลไปหาพาร์ทเนอร์โรงแรม (ถ้ามี)
    if (booking.hotel?.partner) {
      const partner = booking.hotel.partner
      sendHotelPartnerNotification({
        partnerEmail: partner.email,
        partnerName: partner.name,
        bookingCode: booking.booking_code,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        checkIn: booking.check_in_date,
        checkOut: booking.check_out_date,
        numberOfGuests: booking.number_of_guests,
        roomType: booking.room_type
          ? `${booking.room_type.name_th} / ${booking.room_type.name_en}`
          : booking.hotel.room_type_th || booking.hotel.room_type_en,
        specialRequests: booking.special_requests,
        totalPrice: booking.total_price,
        currency: booking.currency || 'THB',
      }).catch(console.error)
    }

    // ส่งอีเมลไปหาพาร์ทเนอร์คนขับรถ (ถ้ามี)
    if (booking.car?.partner) {
      const partner = booking.car.partner
      sendDriverPartnerNotification({
        partnerEmail: partner.email,
        partnerName: partner.name,
        bookingCode: booking.booking_code,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        pickupDate: booking.check_in_date,
        returnDate: booking.check_out_date,
        numberOfPassengers: booking.number_of_guests,
        carName: booking.car.name_th || booking.car.name_en,
        specialRequests: booking.special_requests,
        totalPrice: booking.total_price,
        currency: booking.currency || 'THB',
      }).catch(console.error)
    }

    // ส่งกลับข้อมูลการจองที่สร้างใหม่
    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
