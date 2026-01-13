/**
 * ============================================================
 * Hotels API Route - จัดการข้อมูลโรงแรม
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงรายการโรงแรมทั้งหมดที่เปิดใช้งาน
 *   - POST: สร้างโรงแรมใหม่ (เฉพาะ Admin)
 *
 * Endpoints:
 *   - GET  /api/hotels - ดึงรายการโรงแรม (รองรับ pagination และ filter)
 *   - POST /api/hotels - สร้างโรงแรมใหม่
 *
 * Query Parameters (GET):
 *   - limit: จำนวนรายการต่อหน้า (default: 10)
 *   - offset: ตำแหน่งเริ่มต้น (default: 0)
 *   - location: กรองตามที่ตั้ง
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

/** ฟังก์ชันตรวจสอบสิทธิ์ */
import { 
  verifyAdminToken, 
  verifyPartnerToken, 
  getUserRole,
  unauthorizedResponse, 
  isMockMode 
} from '../../../lib/auth'

// ============================================================
// GET Handler - ดึงรายการโรงแรม
// ============================================================

/**
 * ดึงรายการโรงแรมทั้งหมดที่เปิดใช้งาน
 *
 * @description
 *   - ดึงเฉพาะโรงแรมที่ is_active = true
 *   - รองรับ pagination ด้วย limit และ offset
 *   - รองรับการกรองตามที่ตั้ง (location)
 *   - เรียงตามวันที่สร้างล่าสุดก่อน
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} รายการโรงแรมพร้อมข้อมูล pagination
 *
 * @example
 *   // ดึงโรงแรม 10 รายการแรก
 *   GET /api/hotels
 *
 *   // ดึงโรงแรมหน้าที่ 2 (รายการที่ 11-20)
 *   GET /api/hotels?limit=10&offset=10
 *
 *   // กรองตามที่ตั้ง
 *   GET /api/hotels?location=เชียงราย
 */
export async function GET(request: Request) {
  try {
    // สร้าง Supabase client
    const supabase = await createAdminClient()

    // ตรวจสอบ role ของ user
    const role = await getUserRole()
    const adminAuth = await verifyAdminToken()
    const partnerAuth = await verifyPartnerToken()

    // ดึง query parameters จาก URL
    const { searchParams } = new URL(request.url)

    // ----------------------------------------------------------
    // ตั้งค่า Pagination
    // ----------------------------------------------------------
    /** จำนวนรายการต่อหน้า (default: 10) */
    const limit = parseInt(searchParams.get('limit') || '10')

    /** ตำแหน่งเริ่มต้น (default: 0) */
    const offset = parseInt(searchParams.get('offset') || '0')

    /** ตัวกรองที่ตั้ง (optional) */
    const location = searchParams.get('location')

    // ----------------------------------------------------------
    // สร้าง Query ตาม Role
    // ----------------------------------------------------------
    let query = supabase
      .from('hotels')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filter ตาม role
    if (role === 'admin') {
      // Admin: ดูข้อมูลทั้งหมด (ไม่ filter is_active)
      // ไม่ต้องเพิ่ม filter
    } else if (role === 'partner' && partnerAuth.success && partnerAuth.user) {
      // Partner: ดูเฉพาะโรงแรมของตัวเอง
      query = query.eq('owner_id', partnerAuth.user.id)
    } else {
      // User หรือ Public: ดูเฉพาะโรงแรมที่เปิดใช้งาน
      query = query.eq('is_active', true)
    }

    // เพิ่มตัวกรองที่ตั้ง (ถ้ามี)
    if (location) {
      query = query.ilike('location', `%${location}%`)
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
// POST Handler - สร้างโรงแรมใหม่
// ============================================================

/**
 * สร้างโรงแรมใหม่ในระบบ (เฉพาะ Admin)
 *
 * @description
 *   - ต้องผ่านการยืนยันตัวตน Admin ก่อน
 *   - รองรับ Mock Mode สำหรับการทดสอบ
 *   - ใช้ Admin Client เพื่อข้าม RLS
 *
 * @param {Request} request - HTTP Request พร้อม body เป็นข้อมูลโรงแรม
 * @returns {Promise<NextResponse>} ข้อมูลโรงแรมที่สร้างใหม่
 *
 * @example
 *   POST /api/hotels
 *   Body: {
 *     "name_th": "โรงแรมทดสอบ",
 *     "name_en": "Test Hotel",
 *     "price_per_night": 1500,
 *     ...
 *   }
 */
export async function POST(request: Request) {
  try {
    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ Admin หรือ Partner
    // ----------------------------------------------------------
    const adminAuth = await verifyAdminToken()
    const partnerAuth = await verifyPartnerToken()

    if (!adminAuth.success && !partnerAuth.success) {
      return unauthorizedResponse('Admin or Partner access required')
    }

    // ดึงข้อมูลจาก request body
    const body = await request.json()

    // ----------------------------------------------------------
    // ตั้งค่า owner_id ตาม role
    // ----------------------------------------------------------
    const isAdmin = adminAuth.success
    const isPartner = partnerAuth.success

    // ถ้าเป็น partner: ตั้งค่า owner_id อัตโนมัติ
    if (isPartner && !isAdmin && partnerAuth.user) {
      body.owner_id = partnerAuth.user.id
    }
    // ถ้าเป็น admin: อนุญาตให้ตั้งค่า owner_id เอง (หรือไม่ตั้งก็ได้)

    // ----------------------------------------------------------
    // Mock Mode: สำหรับการทดสอบ
    // ----------------------------------------------------------
    if (isMockMode()) {
      const newHotel = {
        id: `mock-hotel-${Date.now()}`,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(newHotel, { status: 201 })
    }

    // ----------------------------------------------------------
    // Production Mode: บันทึกลง Supabase
    // ----------------------------------------------------------
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('hotels')
      .insert(body)
      .select()
      .single()

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ส่งกลับข้อมูลโรงแรมที่สร้างใหม่
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Create hotel error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
