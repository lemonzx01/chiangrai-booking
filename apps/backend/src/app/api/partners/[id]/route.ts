/**
 * ============================================================
 * Partner API Route (by ID) - จัดการข้อมูลพาร์ทเนอร์รายตัว
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงข้อมูลพาร์ทเนอร์ตาม ID
 *   - PUT: อัปเดตข้อมูลพาร์ทเนอร์ (เฉพาะ Admin)
 *   - DELETE: ลบพาร์ทเนอร์ (เฉพาะ Admin)
 *
 * Endpoints:
 *   - GET    /api/partners/[id] - ดึงข้อมูลพาร์ทเนอร์
 *   - PUT    /api/partners/[id] - อัปเดตข้อมูลพาร์ทเนอร์
 *   - DELETE /api/partners/[id] - ลบพาร์ทเนอร์
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

/** Types */
import { PartnerType } from '@chiangrai/shared/types'
import { logger } from '../../../../lib/logger'

// ============================================================
// GET Handler - ดึงข้อมูลพาร์ทเนอร์
// ============================================================

/**
 * ดึงข้อมูลพาร์ทเนอร์ตาม ID
 *
 * @param {Request} request - HTTP Request object
 * @param {Object} params - Route parameters (id)
 * @returns {Promise<NextResponse>} ข้อมูลพาร์ทเนอร์
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // สร้าง Supabase client
    const supabase = await createClient()

    // ดึงข้อมูลพาร์ทเนอร์
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single()

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // ส่งกลับข้อมูลพาร์ทเนอร์
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// PUT Handler - อัปเดตข้อมูลพาร์ทเนอร์
// ============================================================

/**
 * อัปเดตข้อมูลพาร์ทเนอร์ (เฉพาะ Admin)
 *
 * @param {Request} request - HTTP Request พร้อม body เป็นข้อมูลที่ต้องการอัปเดต
 * @param {Object} params - Route parameters (id)
 * @returns {Promise<NextResponse>} ข้อมูลพาร์ทเนอร์ที่อัปเดตแล้ว
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ Admin
    // ----------------------------------------------------------
    const auth = await verifyAdminToken()
    if (!auth.success) {
      return unauthorizedResponse('Admin access required')
    }

    const { id } = params
    const body = await request.json()

    // ----------------------------------------------------------
    // Validate type (ถ้ามี)
    // ----------------------------------------------------------
    if (body.type && body.type !== PartnerType.HOTEL && body.type !== PartnerType.DRIVER) {
      return NextResponse.json(
        { error: 'Invalid type. Must be HOTEL or DRIVER' },
        { status: 400 }
      )
    }

    // ----------------------------------------------------------
    // Mock Mode: สำหรับการทดสอบ
    // ----------------------------------------------------------
    if (isMockMode()) {
      const updatedPartner = {
        id,
        ...body,
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(updatedPartner)
    }

    // ----------------------------------------------------------
    // Production Mode: อัปเดตใน Supabase
    // ----------------------------------------------------------
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('partners')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ส่งกลับข้อมูลพาร์ทเนอร์ที่อัปเดตแล้ว
    return NextResponse.json(data)
  } catch (error: any) {
    logger.error('Update partner error', { error })
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// DELETE Handler - ลบพาร์ทเนอร์
// ============================================================

/**
 * ลบพาร์ทเนอร์ (เฉพาะ Admin)
 *
 * @param {Request} request - HTTP Request object
 * @param {Object} params - Route parameters (id)
 * @returns {Promise<NextResponse>} สถานะการลบ
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ Admin
    // ----------------------------------------------------------
    const auth = await verifyAdminToken()
    if (!auth.success) {
      return unauthorizedResponse('Admin access required')
    }

    const { id } = params

    // ----------------------------------------------------------
    // Mock Mode: สำหรับการทดสอบ
    // ----------------------------------------------------------
    if (isMockMode()) {
      return NextResponse.json({ message: 'Partner deleted successfully' })
    }

    // ----------------------------------------------------------
    // Production Mode: ลบใน Supabase
    // ----------------------------------------------------------
    const supabase = await createAdminClient()
    const { error } = await supabase.from('partners').delete().eq('id', id)

    // ตรวจสอบ Error
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ส่งกลับสถานะสำเร็จ
    return NextResponse.json({ message: 'Partner deleted successfully' })
  } catch (error: any) {
    logger.error('Delete partner error', { error })
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}









