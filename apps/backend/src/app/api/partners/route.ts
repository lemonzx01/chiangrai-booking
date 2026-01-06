/**
 * ============================================================
 * Partners API Route - จัดการข้อมูลพาร์ทเนอร์
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงรายการพาร์ทเนอร์ทั้งหมด
 *   - POST: สร้างพาร์ทเนอร์ใหม่ (เฉพาะ Admin)
 *
 * Endpoints:
 *   - GET  /api/partners - ดึงรายการพาร์ทเนอร์ (รองรับ pagination และ filter)
 *   - POST /api/partners - สร้างพาร์ทเนอร์ใหม่
 *
 * Query Parameters (GET):
 *   - limit: จำนวนรายการต่อหน้า (default: 10)
 *   - offset: ตำแหน่งเริ่มต้น (default: 0)
 *   - type: กรองตามประเภท (HOTEL/DRIVER)
 *   - is_active: กรองตามสถานะการใช้งาน
 *
 * Authentication:
 *   - GET: ไม่ต้องการ authentication (แต่ควรจำกัดเฉพาะ active)
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

/** Types */
import { PartnerType } from '@chiangrai/shared/types'

// ============================================================
// GET Handler - ดึงรายการพาร์ทเนอร์
// ============================================================

/**
 * ดึงรายการพาร์ทเนอร์ทั้งหมด
 *
 * @description
 *   - ดึงรายการพาร์ทเนอร์ทั้งหมด (หรือเฉพาะที่ is_active = true)
 *   - รองรับ pagination ด้วย limit และ offset
 *   - รองรับการกรองตามประเภท (HOTEL/DRIVER)
 *   - เรียงตามวันที่สร้างล่าสุดก่อน
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} รายการพาร์ทเนอร์พร้อมข้อมูล pagination
 *
 * @example
 *   // ดึงพาร์ทเนอร์ 10 รายการแรก
 *   GET /api/partners
 *
 *   // ดึงเฉพาะโรงแรม
 *   GET /api/partners?type=HOTEL
 *
 *   // ดึงเฉพาะที่เปิดใช้งาน
 *   GET /api/partners?is_active=true
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

    /** ตัวกรองประเภท (optional) */
    const type = searchParams.get('type') as PartnerType | null

    /** ตัวกรองสถานะการใช้งาน (optional) */
    const isActive = searchParams.get('is_active')

    // ----------------------------------------------------------
    // สร้าง Query
    // ----------------------------------------------------------
    let query = supabase
      .from('partners')
      .select('*', { count: 'exact' }) // นับจำนวนทั้งหมดด้วย
      .order('created_at', { ascending: false }) // เรียงจากใหม่ไปเก่า

    // เพิ่มตัวกรองประเภท (ถ้ามี)
    if (type && (type === PartnerType.HOTEL || type === PartnerType.DRIVER)) {
      query = query.eq('type', type)
    }

    // เพิ่มตัวกรองสถานะการใช้งาน (ถ้ามี)
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
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
// POST Handler - สร้างพาร์ทเนอร์ใหม่
// ============================================================

/**
 * สร้างพาร์ทเนอร์ใหม่ในระบบ (เฉพาะ Admin)
 *
 * @description
 *   - ต้องผ่านการยืนยันตัวตน Admin ก่อน
 *   - รองรับ Mock Mode สำหรับการทดสอบ
 *   - ใช้ Admin Client เพื่อข้าม RLS
 *
 * @param {Request} request - HTTP Request พร้อม body เป็นข้อมูลพาร์ทเนอร์
 * @returns {Promise<NextResponse>} ข้อมูลพาร์ทเนอร์ที่สร้างใหม่
 *
 * @example
 *   POST /api/partners
 *   Body: {
 *     "name": "โรงแรมตัวอย่าง",
 *     "email": "hotel@example.com",
 *     "phone": "0812345678",
 *     "type": "HOTEL",
 *     "commission_rate": 10.00,
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
    // Validate required fields
    // ----------------------------------------------------------
    if (!body.name || !body.email || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, type' },
        { status: 400 }
      )
    }

    // Validate type
    if (body.type !== PartnerType.HOTEL && body.type !== PartnerType.DRIVER) {
      return NextResponse.json(
        { error: 'Invalid type. Must be HOTEL or DRIVER' },
        { status: 400 }
      )
    }

    // ----------------------------------------------------------
    // Mock Mode: สำหรับการทดสอบ
    // ----------------------------------------------------------
    if (isMockMode()) {
      const newPartner = {
        id: `mock-partner-${Date.now()}`,
        ...body,
        commission_rate: body.commission_rate || 10.0,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(newPartner, { status: 201 })
    }

    // ----------------------------------------------------------
    // Production Mode: บันทึกลง Supabase
    // ----------------------------------------------------------
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('partners')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        type: body.type,
        stripe_account_id: body.stripe_account_id || null,
        commission_rate: body.commission_rate || 10.0,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single()

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ส่งกลับข้อมูลพาร์ทเนอร์ที่สร้างใหม่
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Create partner error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}









