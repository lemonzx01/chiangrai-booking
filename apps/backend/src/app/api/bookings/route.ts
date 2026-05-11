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

export const dynamic = 'force-dynamic'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** บริการส่งอีเมลแจ้งเตือนพาร์ทเนอร์ */
import { sendPartnerBookingNotification, sendAdminBookingNotification } from '../../../services/notifications/partner'
import { createAdminNotification } from '../../../services/notifications/admin-inbox'

/** ฟังก์ชัน Utility สำหรับการจอง */
import { generateBookingCode, calculateNights, calculateTotalPrice } from '../../../lib/utils'

/** Validation Schema */
import { bookingFormSchema } from '../../../lib/validations'

/** Availability checking */
import { checkRoomAvailability, checkCarAvailability } from '../../../lib/availability'

/** Authentication helpers */
import { verifyAdminToken, verifyPartnerToken } from '../../../lib/auth'
import { BookingStatusEnum, CurrencyEnum } from '@chiangrai/shared/types/supabase'
import { logger } from '../../../lib/logger'

const SUPPORTED_BOOKING_CURRENCIES: CurrencyEnum[] = ['THB', 'USD', 'EUR']

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

    const adminAuth = await verifyAdminToken()
    const partnerAuth = await verifyPartnerToken()
    const role: 'admin' | 'partner' | null =
      adminAuth.success
        ? 'admin'
        : (partnerAuth.success && partnerAuth.user?.role === 'partner')
          ? 'partner'
          : null

    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ----------------------------------------------------------
    // สร้าง Query พร้อม JOIN กับตารางโรงแรมและรถเช่า
    // ----------------------------------------------------------
    let query = supabase
      .from('bookings')
      .select('*, hotel:hotels(*), car:cars(*), room_type:room_types(*), payment:payments(*)', {
        count: 'exact',
      }) // JOIN ข้อมูลที่เกี่ยวข้อง
      .order('created_at', { ascending: false }) // เรียงจากใหม่ไปเก่า

    // เพิ่มตัวกรองสถานะ (ถ้ามี)
    if (role === 'partner' && partnerAuth.user) {
      const partnerId = partnerAuth.user.id

      const [{ data: cars, error: carsError }, { data: hotels, error: hotelsError }] = await Promise.all([
        supabase.from('cars').select('id').eq('owner_id', partnerId),
        supabase.from('hotels').select('id').eq('owner_id', partnerId),
      ])

      if (carsError || hotelsError) {
        return NextResponse.json(
          { error: carsError?.message || hotelsError?.message || 'Failed to load partner assets' },
          { status: 500 }
        )
      }

      const carIds = ((cars as Array<{ id: string }> | null) || [])
        .map((car) => car.id)
        .filter(Boolean)
      const hotelIds = ((hotels as Array<{ id: string }> | null) || [])
        .map((hotel) => hotel.id)
        .filter(Boolean)

      if (carIds.length === 0 && hotelIds.length === 0) {
        return NextResponse.json({
          data: [],
          total: 0,
          limit,
          offset,
        })
      }

      const ownerFilters: string[] = []
      if (carIds.length > 0) {
        ownerFilters.push(`car_id.in.(${carIds.map((id) => `"${id}"`).join(',')})`)
      }
      if (hotelIds.length > 0) {
        ownerFilters.push(`hotel_id.in.(${hotelIds.map((id) => `"${id}"`).join(',')})`)
      }

      query = query.or(ownerFilters.join(','))
    }

    if (status) {
      query = query.eq('status', status as BookingStatusEnum)
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
        car_package_id: body.car_package_id || undefined,
        currency: body.currency || 'THB',
        check_in_date: body.check_in_date,
        check_out_date: body.check_out_date,
        number_of_guests: body.number_of_guests,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        special_requests: body.special_requests || undefined,
      })
    } catch (validationError: unknown) {
      const details =
        typeof validationError === 'object' &&
        validationError !== null &&
        'errors' in validationError
          ? (validationError as { errors: unknown }).errors
          : validationError instanceof Error
            ? validationError.message
            : 'Validation failed'

      return NextResponse.json(
        {
          error: 'Invalid booking payload',
          details,
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
      // ถ้ามี car_package_id ให้คำนวณราคาแบบแพ็กเกจ (fixed price)
      if (validatedData.car_package_id) {
        const { data: carPackage } = await supabase
          .from('car_packages')
          .select('price_thb, max_passengers, duration_days')
          .eq('id', validatedData.car_package_id)
          .eq('is_active', true)
          .single()

        if (!carPackage) {
          return NextResponse.json(
            { error: 'ไม่พบแพ็กเกจรถที่เลือก' },
            { status: 400 }
          )
        }

        // ตรวจจำนวนผู้โดยสารตามแพ็กเกจ (กันคนกรอกเกิน)
        if (validatedData.number_of_guests > carPackage.max_passengers) {
          return NextResponse.json(
            { error: 'จำนวนผู้โดยสารเกินกว่าที่แพ็กเกจรองรับ' },
            { status: 400 }
          )
        }

        // ราคาแพ็กเกจเก็บเป็น THB (แสดงผลแปลงสกุลเงินได้ แต่คิดราคา base เป็น THB)
        total_price = Number(carPackage.price_thb)
      } else {
        // กรณีเช่ารถแบบเดิม: คำนวณจากราคาต่อวัน x จำนวนวัน
        const { data: car } = await supabase
          .from('cars')
          .select('price_per_day, base_price_per_day')
          .eq('id', validatedData.car_id)
          .single()
        const pricePerDay = car?.base_price_per_day || car?.price_per_day || 0
        total_price = calculateTotalPrice(pricePerDay, nights)
      }
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
        logger.warn('Price mismatch detected. Using server-calculated price.')
      }
    }

    // ----------------------------------------------------------
    // ตรวจสอบว่า room_type_id มีจริงใน DB (ป้องกัน FK violation จาก fallback ID)
    // ----------------------------------------------------------
    let verifiedRoomTypeId = validatedData.room_type_id || null
    if (verifiedRoomTypeId) {
      const { data: rtCheck } = await supabase
        .from('room_types')
        .select('id')
        .eq('id', verifiedRoomTypeId)
        .single()
      if (!rtCheck) {
        verifiedRoomTypeId = null
      }
    }

    // ----------------------------------------------------------
    // ตรวจสอบห้องว่าง / รถว่าง (Availability Check)
    // ----------------------------------------------------------
    // Optional pre-flight availability check (best-effort, race-prone).
    // The atomic RPC below is the source of truth — this only gives
    // an early 409 to avoid hitting the lock for obvious failures.
    if (verifiedRoomTypeId) {
      const availability = await checkRoomAvailability(
        supabase,
        verifiedRoomTypeId,
        validatedData.check_in_date,
        validatedData.check_out_date
      )
      if (!availability.available) {
        return NextResponse.json(
          { error: 'ห้องพักเต็มในช่วงวันที่เลือก กรุณาเลือกวันอื่น' },
          { status: 409 }
        )
      }
    }

    if (validatedData.car_id) {
      const availability = await checkCarAvailability(
        supabase,
        validatedData.car_id,
        validatedData.check_in_date,
        validatedData.check_out_date
      )
      if (!availability.available) {
        return NextResponse.json(
          { error: 'รถไม่ว่างในช่วงวันที่เลือก กรุณาเลือกวันอื่น' },
          { status: 409 }
        )
      }
    }

    // ----------------------------------------------------------
    // บันทึกการจองลง Database (atomic via RPC)
    // ----------------------------------------------------------
    const requestedCurrency = validatedData.currency || 'THB'
    const bookingCurrency: CurrencyEnum = SUPPORTED_BOOKING_CURRENCIES.includes(
      requestedCurrency as CurrencyEnum
    )
      ? (requestedCurrency as CurrencyEnum)
      : 'THB'

    // Decide which atomic RPC to call: car-only bookings use the car
    // variant; everything else (hotel/combo) uses the room variant.
    const isCarOnly =
      !!validatedData.car_id && !validatedData.hotel_id && !verifiedRoomTypeId
    const rpcName = isCarOnly ? 'create_car_booking_atomic' : 'create_booking_atomic'

    const rpcParams: Record<string, unknown> = {
      p_booking_code: booking_code,
      p_booking_type: validatedData.booking_type,
      p_check_in_date: validatedData.check_in_date,
      p_check_out_date: validatedData.check_out_date,
      p_number_of_guests: validatedData.number_of_guests,
      p_customer_name: validatedData.customer_name,
      p_customer_email: validatedData.customer_email,
      p_customer_phone: validatedData.customer_phone,
      p_special_requests: validatedData.special_requests || null,
      p_total_price: total_price,
      p_currency: bookingCurrency,
    }
    if (isCarOnly) {
      rpcParams.p_car_id = validatedData.car_id
    } else {
      rpcParams.p_hotel_id = validatedData.hotel_id || null
      rpcParams.p_room_type_id = verifiedRoomTypeId
    }

    const { data: rpcBooking, error: rpcError } = await (supabase as any).rpc(
      rpcName,
      rpcParams
    )

    if (rpcError) {
      const msg = String(rpcError.message || '')
      if (msg.includes('DATES_BLOCKED')) {
        return NextResponse.json(
          {
            error: 'ช่วงวันที่เลือกไม่เปิดรับการจอง (ผู้ให้บริการได้บล็อกไว้) กรุณาเลือกวันอื่น',
            code: 'DATES_BLOCKED',
          },
          { status: 409 }
        )
      }
      if (msg.includes('ROOM_FULL') || msg.includes('CAR_FULL')) {
        return NextResponse.json(
          {
            error: isCarOnly
              ? 'รถไม่ว่างในช่วงวันที่เลือก กรุณาเลือกวันอื่น'
              : 'ห้องพักเต็มในช่วงวันที่เลือก กรุณาเลือกวันอื่น',
          },
          { status: 409 }
        )
      }
      logger.error('Atomic booking RPC failed', { rpcName, message: rpcError.message })
      return NextResponse.json({ error: 'ไม่สามารถสร้างการจองได้' }, { status: 500 })
    }

    // RPC returns just the bookings row. Refetch with relations so the
    // response shape matches the previous behaviour.
    const insertedId = (rpcBooking as any)?.id
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, hotel:hotels(*), car:cars(*), room_type:room_types(*)')
      .eq('id', insertedId)
      .single()

    if (error || !booking) {
      logger.error('Refetch booking after RPC failed', { error })
      // Fall back to the bare RPC result so the client still gets data.
      return NextResponse.json(rpcBooking, { status: 201 })
    }

    // ----------------------------------------------------------
    // ส่งอีเมลแจ้งเตือนพาร์ทเนอร์ (owner) และ Admin (non-blocking)
    // ----------------------------------------------------------
    // หา owner_id หรือ partner_id จาก hotel หรือ car
    const ownerId = booking.hotel?.owner_id || booking.hotel?.partner_id || booking.car?.owner_id || booking.car?.partner_id
    
    if (ownerId) {
      sendPartnerBookingNotification(ownerId, booking).catch((err) =>
        logger.error('sendPartnerBookingNotification failed', { error: err })
      )
    }

    // ส่งอีเมลแจ้งเตือน Admin
    sendAdminBookingNotification(booking).catch((err) =>
      logger.error('sendAdminBookingNotification failed', { error: err })
    )

    // In-app admin inbox notification
    const itemNameForInbox =
      booking.hotel?.name_th || booking.hotel?.name_en || booking.car?.name_th || booking.car?.name_en || 'รายการ'
    createAdminNotification({
      type: 'booking.created',
      title: `มีการจองใหม่: ${booking.booking_code}`,
      body: `${booking.customer_name} จอง${itemNameForInbox}`,
      link: `/admin/bookings`,
      data: {
        booking_id: booking.id,
        booking_code: booking.booking_code,
        booking_type: booking.booking_type,
        total_price: booking.total_price,
      },
      severity: 'info',
    })

    // ส่งกลับข้อมูลการจองที่สร้างใหม่
    return NextResponse.json(booking, { status: 201 })
  } catch (error: unknown) {
    // Log error เฉพาะใน development mode
    if (process.env.NODE_ENV === 'development') {
      logger.error('Booking error', { error })
    }
    // ไม่ leak error details ใน production
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

