/**
 * ============================================================
 * Room Types API Route - จัดการข้อมูลประเภทห้อง
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงรายการประเภทห้องทั้งหมด (รองรับ filter ตาม hotel_id)
 *   - POST: สร้างประเภทห้องใหม่ (เฉพาะ Admin)
 *
 * Endpoints:
 *   - GET  /api/room-types - ดึงรายการประเภทห้อง
 *   - POST /api/room-types - สร้างประเภทห้องใหม่
 *
 * Query Parameters (GET):
 *   - hotel_id: กรองตามโรงแรม (optional)
 *   - is_active: กรองตามสถานะ (optional)
 *
 * Authentication:
 *   - GET: ไม่ต้องการ authentication
 *   - POST: ต้องเป็น Admin เท่านั้น
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase client สำหรับ Server-side */
import { createClient, createAdminClient } from '@/lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันตรวจสอบสิทธิ์ Admin */
import { verifyAdminToken, unauthorizedResponse, isMockMode } from '@/lib/auth'

// ============================================================
// GET Handler - ดึงรายการประเภทห้อง
// ============================================================

/**
 * ดึงรายการประเภทห้องทั้งหมด
 *
 * @description
 *   - ดึงประเภทห้องที่เปิดใช้งาน (is_active = true) เป็นค่าเริ่มต้น
 *   - รองรับการกรองตาม hotel_id
 *   - เรียงตามวันที่สร้างล่าสุดก่อน
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} รายการประเภทห้อง
 *
 * @example
 *   // ดึงประเภทห้องทั้งหมด
 *   GET /api/room-types
 *
 *   // กรองตามโรงแรม
 *   GET /api/room-types?hotel_id=xxx
 */
export async function GET(request: Request) {
  try {
    // สร้าง Supabase client
    const supabase = await createClient()

    // ดึง query parameters จาก URL
    const { searchParams } = new URL(request.url)

    /** ตัวกรองโรงแรม (optional) */
    const hotelId = searchParams.get('hotel_id')

    /** ตัวกรองสถานะ (optional, default: true) */
    const isActive = searchParams.get('is_active')

    // ----------------------------------------------------------
    // สร้าง Query
    // ----------------------------------------------------------
    let query = supabase
      .from('room_types')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // เพิ่มตัวกรองโรงแรม (ถ้ามี)
    if (hotelId) {
      query = query.eq('hotel_id', hotelId)
    }

    // เพิ่มตัวกรองสถานะ (ถ้ามี)
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    } else {
      // Default: แสดงเฉพาะที่เปิดใช้งาน
      query = query.eq('is_active', true)
    }

    // ----------------------------------------------------------
    // ดึงข้อมูล
    // ----------------------------------------------------------
    const { data, error, count } = await query

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ส่งกลับข้อมูล
    return NextResponse.json({
      data: data || [],
      total: count || 0,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// POST Handler - สร้างประเภทห้องใหม่
// ============================================================

/**
 * สร้างประเภทห้องใหม่ในระบบ (เฉพาะ Admin)
 *
 * @description
 *   - ต้องผ่านการยืนยันตัวตน Admin ก่อน
 *   - รองรับ Mock Mode สำหรับการทดสอบ
 *   - ใช้ Admin Client เพื่อข้าม RLS
 *
 * @param {Request} request - HTTP Request พร้อม body เป็นข้อมูลประเภทห้อง
 * @returns {Promise<NextResponse>} ข้อมูลประเภทห้องที่สร้างใหม่
 *
 * @example
 *   POST /api/room-types
 *   Body: {
 *     "hotel_id": "uuid-here",
 *     "name_th": "ห้องดีลักซ์",
 *     "name_en": "Deluxe Room",
 *     "price_per_night": 2500,
 *     "max_guests": 2,
 *     "is_active": true
 *   }
 */
export async function POST(request: Request) {
  try {
    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ Admin
    // ----------------------------------------------------------
    const auth = await verifyAdminToken()
    if (!auth.success) {
      return unauthorizedResponse('Admin access required')
    }

    // ดึงข้อมูลจาก request body
    const body = await request.json()

    // ----------------------------------------------------------
    // Mock Mode: สำหรับการทดสอบ
    // ----------------------------------------------------------
    if (isMockMode()) {
      const newRoomType = {
        id: `mock-room-type-${Date.now()}`,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(newRoomType, { status: 201 })
    }

    // ----------------------------------------------------------
    // Production Mode: บันทึกลง Supabase
    // ----------------------------------------------------------
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('room_types')
      .insert(body)
      .select()
      .single()

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ส่งกลับข้อมูลประเภทห้องที่สร้างใหม่
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Create room type error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}



