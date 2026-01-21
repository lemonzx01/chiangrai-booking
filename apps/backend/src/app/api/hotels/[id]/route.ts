/**
 * ============================================================
 * Hotels Dynamic API Route - จัดการโรงแรมรายตัว
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงข้อมูลโรงแรมตาม ID
 *   - PUT: อัพเดทข้อมูลโรงแรม (เฉพาะ Admin)
 *   - DELETE: ลบโรงแรม (เฉพาะ Admin)
 *
 * Endpoints:
 *   - GET    /api/hotels/[id] - ดึงข้อมูลโรงแรมรายตัว
 *   - PUT    /api/hotels/[id] - อัพเดทโรงแรม
 *   - DELETE /api/hotels/[id] - ลบโรงแรม
 *
 * Authentication:
 *   - GET: ไม่ต้องการ authentication
 *   - PUT/DELETE: ต้องเป็น Admin เท่านั้น
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase client สำหรับ Server-side */
import { createClient, createAdminClient } from '../../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันตรวจสอบสิทธิ์ Admin */
import { verifyAdminToken, unauthorizedResponse, isMockMode } from '../../../../lib/auth'
import { MOCK_HOTELS } from '../../../../lib/constants'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Interface สำหรับ Dynamic Route Parameters
 *
 * @interface Params
 * @property {Promise<{ id: string }>} params - Promise ที่มี ID ของโรงแรม
 *
 * @note Next.js 15 ใช้ params เป็น Promise
 */
interface Params {
  params: Promise<{ id: string }>
}

// ============================================================
// GET Handler - ดึงข้อมูลโรงแรมรายตัว
// ============================================================

/**
 * ดึงข้อมูลโรงแรมตาม ID
 *
 * @description
 *   - ดึงข้อมูลโรงแรมเดี่ยวจาก Supabase
 *   - ไม่ต้องการ authentication
 *
 * @param {Request} request - HTTP Request object
 * @param {Params} params - Route parameters ที่มี ID
 * @returns {Promise<NextResponse>} ข้อมูลโรงแรม หรือ error 404
 *
 * @example
 *   GET /api/hotels/123e4567-e89b-12d3-a456-426614174000
 */
export async function GET(request: Request, { params }: Params) {
  try {
    // ดึง ID จาก params (Next.js 15 ใช้ await)
    const { id } = await params

    // ----------------------------------------------------------
    // Mock Mode: ใช้ข้อมูลจำลอง
    // ----------------------------------------------------------
    if (isMockMode()) {
      const mockHotel = MOCK_HOTELS.find((hotel) => hotel.id === id)

      if (!mockHotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
      }

      const normalizedHotel = {
        ...mockHotel,
        location:
          (mockHotel as any).location ||
          (mockHotel as any).location_th ||
          (mockHotel as any).location_en ||
          '',
      }

      // สร้าง mock room_types สำหรับ hotel
      // Generate UUID-like ID for room_type (format: 8-4-4-4-12)
      const generateMockUUID = (prefix: string) => {
        const cleanPrefix = prefix.replace(/-/g, '').substring(0, 20)
        const parts = [
          cleanPrefix.padEnd(8, '0').substring(0, 8),
          '0000',
          '4000',
          '8000',
          cleanPrefix.padEnd(12, '0').substring(0, 12)
        ]
        return parts.join('-')
      }
      const mockRoomTypes = [
        {
          id: generateMockUUID(id),
          hotel_id: id,
          name_th: (mockHotel as any).room_type_th || 'ห้องมาตรฐาน',
          name_en: (mockHotel as any).room_type_en || 'Standard Room',
          price_per_night: mockHotel.price_per_night,
          max_guests: mockHotel.max_guests,
          is_active: true,
          created_at: mockHotel.created_at,
          updated_at: mockHotel.created_at,
        },
      ]

      return NextResponse.json({
        hotel: normalizedHotel,
        room_types: mockRoomTypes,
      })
    }

    const supabase = await createAdminClient()

    // ----------------------------------------------------------
    // ดึงข้อมูลโรงแรมพร้อม room_types
    // ----------------------------------------------------------
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', id)
      .single()

    // ตรวจสอบ Error (รวมถึงกรณีไม่พบข้อมูล)
    if (hotelError || !hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // ดึง room_types สำหรับ hotel นี้
    const { data: roomTypes, error: roomTypesError } = await supabase
      .from('room_types')
      .select('*')
      .eq('hotel_id', id)
      .eq('is_active', true)

    // ถ้าไม่มี room_types ให้สร้าง default room type จาก hotel data
    // Generate UUID-like ID for room_type (format: 8-4-4-4-12)
    const generateMockUUID = (prefix: string) => {
      const hex = '0123456789abcdef'
      const parts = [
        prefix.replace(/-/g, '').padEnd(8, '0').substring(0, 8),
        '0000',
        '4000',
        '8000',
        prefix.replace(/-/g, '').padEnd(12, '0').substring(0, 12)
      ]
      return parts.join('-')
    }
    const finalRoomTypes = roomTypes && roomTypes.length > 0 
      ? roomTypes 
      : [{
          id: generateMockUUID(id),
          hotel_id: id,
          name_th: hotel.name_th || 'ห้องมาตรฐาน',
          name_en: hotel.name_en || 'Standard Room',
          price_per_night: hotel.price_per_night || hotel.base_price_per_night || 0,
          max_guests: hotel.max_guests || 2,
          is_active: true,
          created_at: hotel.created_at,
          updated_at: hotel.updated_at,
        }]

    return NextResponse.json({
      hotel,
      room_types: finalRoomTypes,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// PUT Handler - อัพเดทโรงแรม
// ============================================================

/**
 * อัพเดทข้อมูลโรงแรม (เฉพาะ Admin)
 *
 * @description
 *   - ต้องผ่านการยืนยันตัวตน Admin ก่อน
 *   - รองรับ Mock Mode สำหรับการทดสอบ
 *   - ใช้ Admin Client เพื่อข้าม RLS
 *
 * @param {Request} request - HTTP Request พร้อม body เป็นข้อมูลที่จะอัพเดท
 * @param {Params} params - Route parameters ที่มี ID
 * @returns {Promise<NextResponse>} ข้อมูลโรงแรมที่อัพเดทแล้ว
 *
 * @example
 *   PUT /api/hotels/123e4567-e89b-12d3-a456-426614174000
 *   Body: { "price_per_night": 2000 }
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ Admin
    // ----------------------------------------------------------
    const auth = await verifyAdminToken()
    if (!auth.success) {
      return unauthorizedResponse('Admin access required')
    }

    // ดึง ID และ body
    const { id } = await params
    const body = await request.json()

    // ----------------------------------------------------------
    // Mock Mode: สำหรับการทดสอบ
    // ----------------------------------------------------------
    if (isMockMode()) {
      return NextResponse.json({
        ...body,
        id,
        updated_at: new Date().toISOString(),
      })
    }

    // ----------------------------------------------------------
    // Production Mode: อัพเดทใน Supabase
    // ----------------------------------------------------------
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('hotels')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Update hotel error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// DELETE Handler - ลบโรงแรม
// ============================================================

/**
 * ลบโรงแรมออกจากระบบ (เฉพาะ Admin)
 *
 * @description
 *   - ต้องผ่านการยืนยันตัวตน Admin ก่อน
 *   - ลบข้อมูลถาวรจาก Database
 *
 * @param {Request} request - HTTP Request object
 * @param {Params} params - Route parameters ที่มี ID
 * @returns {Promise<NextResponse>} สถานะความสำเร็จ
 *
 * @example
 *   DELETE /api/hotels/123e4567-e89b-12d3-a456-426614174000
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ Admin
    // ----------------------------------------------------------
    const auth = await verifyAdminToken()
    if (!auth.success) {
      return unauthorizedResponse('Admin access required')
    }

    // ดึง ID
    const { id } = await params
    const supabase = await createAdminClient()

    // ----------------------------------------------------------
    // ลบโรงแรม
    // ----------------------------------------------------------
    const { error } = await supabase.from('hotels').delete().eq('id', id)

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
