/**
 * ============================================================
 * Cars API Route - จัดการข้อมูลรถเช่า
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงรายการรถเช่าทั้งหมดที่เปิดใช้งาน
 *   - POST: สร้างรถเช่าใหม่ (เฉพาะ Admin)
 *
 * Endpoints:
 *   - GET  /api/cars - ดึงรายการรถเช่า (รองรับ pagination และ filter)
 *   - POST /api/cars - สร้างรถเช่าใหม่
 *
 * Query Parameters (GET):
 *   - limit: จำนวนรายการต่อหน้า (default: 10)
 *   - offset: ตำแหน่งเริ่มต้น (default: 0)
 *   - car_type: กรองตามประเภทรถ (ค้นหาทั้งภาษาไทยและอังกฤษ)
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
import { createClient, createAdminClient } from '../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันตรวจสอบสิทธิ์ Admin */
import { verifyAdminToken, unauthorizedResponse, isMockMode } from '../../../lib/auth'

// ============================================================
// GET Handler - ดึงรายการรถเช่า
// ============================================================

/**
 * ดึงรายการรถเช่าทั้งหมดที่เปิดใช้งาน
 *
 * @description
 *   - ดึงเฉพาะรถที่ is_active = true
 *   - รองรับ pagination ด้วย limit และ offset
 *   - รองรับการกรองตามประเภทรถ (ค้นหาทั้งไทยและอังกฤษ)
 *   - เรียงตามวันที่สร้างล่าสุดก่อน
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} รายการรถเช่าพร้อมข้อมูล pagination
 *
 * @example
 *   // ดึงรถเช่า 10 รายการแรก
 *   GET /api/cars
 *
 *   // ดึงรถเช่าหน้าที่ 2 (รายการที่ 11-20)
 *   GET /api/cars?limit=10&offset=10
 *
 *   // กรองตามประเภทรถ
 *   GET /api/cars?car_type=SUV
 */
export async function GET(request: Request) {
  try {
    // สร้าง Supabase client
    const supabase = await createClient()

    // ดึง query parameters จาก URL
    const { searchParams } = new URL(request.url)

    // ----------------------------------------------------------
    // ตั้งค่า Pagination
    // ----------------------------------------------------------
    /** จำนวนรายการต่อหน้า (default: 10) */
    const limit = parseInt(searchParams.get('limit') || '10')

    /** ตำแหน่งเริ่มต้น (default: 0) */
    const offset = parseInt(searchParams.get('offset') || '0')

    /** ตัวกรองประเภทรถ (optional) */
    const carType = searchParams.get('car_type')

    // ----------------------------------------------------------
    // สร้าง Query
    // ----------------------------------------------------------
    let query = supabase
      .from('cars')
      .select('*', { count: 'exact' }) // นับจำนวนทั้งหมดด้วย
      .eq('is_active', true) // เฉพาะรถที่เปิดใช้งาน
      .order('created_at', { ascending: false }) // เรียงจากใหม่ไปเก่า

    // เพิ่มตัวกรองประเภทรถ (ถ้ามี) - ค้นหาทั้งไทยและอังกฤษ
    if (carType) {
      query = query.or(`car_type_th.ilike.%${carType}%,car_type_en.ilike.%${carType}%`)
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
// POST Handler - สร้างรถเช่าใหม่
// ============================================================

/**
 * สร้างรถเช่าใหม่ในระบบ (เฉพาะ Admin)
 *
 * @description
 *   - ต้องผ่านการยืนยันตัวตน Admin ก่อน
 *   - รองรับ Mock Mode สำหรับการทดสอบ
 *   - ใช้ Admin Client เพื่อข้าม RLS
 *
 * @param {Request} request - HTTP Request พร้อม body เป็นข้อมูลรถเช่า
 * @returns {Promise<NextResponse>} ข้อมูลรถเช่าที่สร้างใหม่
 *
 * @example
 *   POST /api/cars
 *   Body: {
 *     "name_th": "รถทดสอบ",
 *     "name_en": "Test Car",
 *     "price_per_day": 1500,
 *     ...
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
      const newCar = {
        id: `mock-car-${Date.now()}`,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(newCar, { status: 201 })
    }

    // ----------------------------------------------------------
    // Production Mode: บันทึกลง Supabase
    // ----------------------------------------------------------
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('cars')
      .insert(body)
      .select()
      .single()

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ส่งกลับข้อมูลรถเช่าที่สร้างใหม่
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Create car error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
