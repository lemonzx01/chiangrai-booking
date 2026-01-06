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
import { createAdminClient } from '../../../lib/supabase/server'

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
import { generateBookingCode, calculateNights, calculateTotalPrice } from '../../../lib/utils'

/** Validation Schema */
import { bookingFormSchema } from '../../../lib/validations'

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
    // Validate Input ด้วย Zod Schema
    // ----------------------------------------------------------
    let validatedData
    try {
      validatedData = bookingFormSchema.parse({
        booking_type: body.booking_type,
        hotel_id: body.hotel_id || undefined,
        car_id: body.car_id || undefined,
        room_type_id: body.room_type_id || undefined,
        currency: body.currency || 'THB',
        check_in_date: body.check_in_date,
        check_out_date: body.check_out_date,
        number_of_guests: body.number_of_guests,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        customer_line: body.customer_line || undefined,
        special_requests: body.special_requests || undefined,
      })
    } catch (validationError: any) {
      return NextResponse.json(
        { 
          error: 'ข้อมูลไม่ถูกต้อง',
          details: validationError.errors || validationError.message 
        },
        { status: 400 }
      )
    }

    // ----------------------------------------------------------
    // สร้างรหัสการจอง
    // ----------------------------------------------------------
    /** รหัสการจองอัตโนมัติ เช่น BK-ABC123 */
    const booking_code = generateBookingCode()

    // ----------------------------------------------------------
    // คำนวณราคารวม (Server-side calculation - ไม่ trust client)
    // ----------------------------------------------------------
    let total_price: number

    // คำนวณราคาใน server-side เสมอ (ไม่ trust client-sent total_price)
    /** จำนวนคืน/วัน */
    const nights = calculateNights(validatedData.check_in_date, validatedData.check_out_date)

    // คำนวณราคาตามประเภทการจอง
    if (validatedData.booking_type === 'HOTEL' && validatedData.hotel_id) {
      // ถ้ามี room_type_id ให้ใช้ราคาจากประเภทห้อง
      if (validatedData.room_type_id) {
        const { data: roomType } = await supabase
          .from('room_types')
          .select('price_per_night')
          .eq('id', validatedData.room_type_id)
          .single()
        
        // ถ้าพบ room type ให้ใช้ราคาจาก room type
        if (roomType) {
          total_price = calculateTotalPrice(roomType.price_per_night, nights)
        } else {
          // ถ้าไม่พบ room type ให้ fallback ไปใช้ราคาจากโรงแรม
          const { data: hotel } = await supabase
            .from('hotels')
            .select('price_per_night, base_price_per_night')
            .eq('id', validatedData.hotel_id)
            .single()
          const pricePerNight = hotel?.base_price_per_night || hotel?.price_per_night || 0
          total_price = calculateTotalPrice(pricePerNight, nights)
        }
      } else {
        // ถ้าไม่มี room_type_id ให้ใช้ราคาจากโรงแรม
        const { data: hotel } = await supabase
          .from('hotels')
          .select('price_per_night, base_price_per_night')
          .eq('id', validatedData.hotel_id)
          .single()
        const pricePerNight = hotel?.base_price_per_night || hotel?.price_per_night || 0
        total_price = calculateTotalPrice(pricePerNight, nights)
      }
    }
    // กรณีเช่ารถ
    else if (validatedData.booking_type === 'CAR' && validatedData.car_id) {
      const { data: car } = await supabase
        .from('cars')
        .select('price_per_day, base_price_per_day')
        .eq('id', validatedData.car_id)
        .single()
      const pricePerDay = car?.base_price_per_day || car?.price_per_day || 0
      total_price = calculateTotalPrice(pricePerDay, nights)
    } else {
      return NextResponse.json(
        { error: 'ไม่สามารถคำนวณราคาได้ กรุณาตรวจสอบข้อมูลการจอง' },
        { status: 400 }
      )
    }
    
    // ตรวจสอบว่า client-sent total_price ตรงกับที่คำนวณหรือไม่ (ถ้ามี)
    // ใช้ราคาที่คำนวณใน server-side เสมอ (ไม่ trust client)
    if (body.total_price && Math.abs(body.total_price - total_price) > 0.01) {
      // Log เฉพาะใน development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('Price mismatch detected. Using server-calculated price.')
      }
    }

    // ----------------------------------------------------------
    // บันทึกการจองลง Database
    // ----------------------------------------------------------
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        booking_type: validatedData.booking_type,
        hotel_id: validatedData.hotel_id || null,
        car_id: validatedData.car_id || null,
        room_type_id: validatedData.room_type_id || null,
        check_in_date: validatedData.check_in_date,
        check_out_date: validatedData.check_out_date,
        number_of_guests: validatedData.number_of_guests,
        customer_name: validatedData.customer_name,
        customer_email: validatedData.customer_email,
        customer_phone: validatedData.customer_phone,
        customer_line: validatedData.customer_line || null,
        special_requests: validatedData.special_requests || null,
        booking_code,
        total_price, // ใช้ราคาที่คำนวณใน server-side
        currency: validatedData.currency || 'THB',
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
          : booking.hotel?.room_type_th || booking.hotel?.room_type_en || 'ไม่ระบุ',
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
  } catch (error: any) {
    // Log error เฉพาะใน development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('Booking error:', error)
    }
    // ไม่ leak error details ใน production
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
