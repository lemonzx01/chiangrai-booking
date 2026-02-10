/**
 * ============================================================
 * Cars Dynamic API Route - จัดการรถเช่ารายตัว
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงข้อมูลรถเช่าตาม ID
 *   - PUT: อัพเดทข้อมูลรถเช่า (เฉพาะ Admin)
 *   - DELETE: ลบรถเช่า (เฉพาะ Admin)
 *
 * Endpoints:
 *   - GET    /api/cars/[id] - ดึงข้อมูลรถเช่ารายตัว
 *   - PUT    /api/cars/[id] - อัพเดทรถเช่า
 *   - DELETE /api/cars/[id] - ลบรถเช่า
 *
 * Authentication:
 *   - GET: ไม่ต้องการ authentication
 *   - PUT/DELETE: ต้องเป็น Admin เท่านั้น
 *
 * ============================================================
 */
export const dynamic = 'force-dynamic'


// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase client สำหรับ Server-side */
import { createClient, createAdminClient } from '../../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันตรวจสอบสิทธิ์ Admin */
import { verifyAdminToken, unauthorizedResponse, isMockMode } from '../../../../lib/auth'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Interface สำหรับ Dynamic Route Parameters
 *
 * @interface Params
 * @property {Promise<{ id: string }>} params - Promise ที่มี ID ของรถเช่า
 *
 * @note Next.js 15 ใช้ params เป็น Promise
 */
interface Params {
  params: Promise<{ id: string }>
}

// ============================================================
// GET Handler - ดึงข้อมูลรถเช่ารายตัว
// ============================================================

/**
 * ดึงข้อมูลรถเช่าตาม ID
 *
 * @description
 *   - ดึงข้อมูลรถเช่าเดี่ยวจาก Supabase
 *   - ไม่ต้องการ authentication
 *
 * @param {Request} request - HTTP Request object
 * @param {Params} params - Route parameters ที่มี ID
 * @returns {Promise<NextResponse>} ข้อมูลรถเช่า หรือ error 404
 *
 * @example
 *   GET /api/cars/123e4567-e89b-12d3-a456-426614174000
 */
export async function GET(request: Request, { params }: Params) {
  try {
    // ดึง ID จาก params (Next.js 15 ใช้ await)
    const { id } = await params
    const supabase = await createClient()

    // ----------------------------------------------------------
    // ดึงข้อมูลรถเช่า
    // ----------------------------------------------------------
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single() // คืนค่าเป็น object เดียว (ไม่ใช่ array)

    // ตรวจสอบ Error (รวมถึงกรณีไม่พบข้อมูล)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// PUT Handler - อัพเดทรถเช่า
// ============================================================

/**
 * อัพเดทข้อมูลรถเช่า (เฉพาะ Admin)
 *
 * @description
 *   - ต้องผ่านการยืนยันตัวตน Admin ก่อน
 *   - รองรับ Mock Mode สำหรับการทดสอบ
 *   - ใช้ Admin Client เพื่อข้าม RLS
 *
 * @param {Request} request - HTTP Request พร้อม body เป็นข้อมูลที่จะอัพเดท
 * @param {Params} params - Route parameters ที่มี ID
 * @returns {Promise<NextResponse>} ข้อมูลรถเช่าที่อัพเดทแล้ว
 *
 * @example
 *   PUT /api/cars/123e4567-e89b-12d3-a456-426614174000
 *   Body: { "price_per_day": 2000 }
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
      .from('cars')
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
    console.error('Update car error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// DELETE Handler - ลบรถเช่า
// ============================================================

/**
 * ลบรถเช่าออกจากระบบ (เฉพาะ Admin)
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
 *   DELETE /api/cars/123e4567-e89b-12d3-a456-426614174000
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
    // ลบรถเช่า
    // ----------------------------------------------------------
    const { error } = await supabase.from('cars').delete().eq('id', id)

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
