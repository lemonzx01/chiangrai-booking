/**
 * ============================================================
 * Bookings Dynamic API Route - จัดการการจองตามรหัส
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - GET: ดึงข้อมูลการจองตามรหัส (พร้อมการยืนยันตัวตน)
 *   - PATCH: อัพเดทสถานะการจอง (เฉพาะ Admin)
 *
 * Endpoints:
 *   - GET   /api/bookings/[code] - ดึงข้อมูลการจอง
 *   - PATCH /api/bookings/[code] - อัพเดทการจอง
 *
 * Authentication (GET):
 *   - Admin: ดูได้ทุกการจอง
 *   - User ที่ login: ต้องมี email ตรงกับการจอง
 *   - Guest: ต้องระบุ email ที่ตรงกับการจอง
 *
 * Authentication (PATCH):
 *   - ต้องเป็น Admin เท่านั้น
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

/** ฟังก์ชันตรวจสอบสิทธิ์ */
import { verifyAdminToken, verifyUserToken, unauthorizedResponse, isMockMode } from '../../../../lib/auth'

/** ข้อมูล Mock สำหรับการทดสอบ */
import { findMockBookingByCode } from '../../../../lib/mock-data'

/** Status transition rules */
import { VALID_STATUS_TRANSITIONS } from '@chiangrai/shared/types'
import { logAdminAction } from '../../../../lib/audit'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Interface สำหรับ Dynamic Route Parameters
 *
 * @interface Params
 * @property {Promise<{ code: string }>} params - Promise ที่มีรหัสการจอง
 *
 * @note Next.js 15 ใช้ params เป็น Promise
 */
interface Params {
  params: Promise<{ code: string }>
}

// ============================================================
// GET Handler - ดึงข้อมูลการจองตามรหัส
// ============================================================

/**
 * ดึงข้อมูลการจองตามรหัส พร้อมการยืนยันตัวตน
 *
 * @description
 *   การยืนยันตัวตน 3 ระดับ:
 *   1. Admin - ดูได้ทุกการจอง
 *   2. User ที่ login - ต้องมี email ตรงกับการจอง
 *   3. Guest - ต้องระบุ email query param ที่ตรงกับการจอง
 *
 *   รองรับ Mock Mode สำหรับการทดสอบ
 *
 * @param {Request} request - HTTP Request object
 * @param {Params} params - Route parameters ที่มีรหัสการจอง
 * @returns {Promise<NextResponse>} ข้อมูลการจอง หรือ error
 *
 * @example
 *   // Admin ดูการจอง
 *   GET /api/bookings/BK-ABC123
 *
 *   // Guest ดูการจอง (ต้องระบุ email)
 *   GET /api/bookings/BK-ABC123?email=customer@example.com
 */
export async function GET(request: Request, { params }: Params) {
  try {
    // ดึงรหัสการจองจาก params
    const { code } = await params
    const { searchParams } = new URL(request.url)

    /** Email ที่ระบุมาสำหรับยืนยันตัวตน */
    const email = searchParams.get('email')?.toLowerCase()

    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ Admin
    // ----------------------------------------------------------
    const adminAuth = await verifyAdminToken()
    if (adminAuth.success) {
      // Admin สามารถดูการจองใดๆ ก็ได้

      // Mock Mode
      if (isMockMode()) {
        const booking = findMockBookingByCode(code)
        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }
        return NextResponse.json(booking)
      }

      // Production Mode
      const supabaseAdmin = await createAdminClient()
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('*, hotel:hotels(*), car:cars(*), payment:payments(*)')
        .eq('booking_code', code)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      return NextResponse.json(data)
    }

    // ----------------------------------------------------------
    // ตรวจสอบ User ที่ login
    // ----------------------------------------------------------
    const userAuth = await verifyUserToken()

    // ----------------------------------------------------------
    // Mock Mode: สำหรับการทดสอบ (ไม่ต้องยืนยัน email)
    // ----------------------------------------------------------
    if (isMockMode()) {
      const booking = findMockBookingByCode(code)
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // ใน Mock Mode ไม่ต้องยืนยัน email เพื่อให้ทดสอบได้ง่าย
      // ส่ง id ด้วยเพราะ checkout ต้องใช้ booking_id
      return NextResponse.json(booking)
    }

    // ----------------------------------------------------------
    // Production Mode (ใช้ admin client เพราะ API มี access control เอง)
    // ----------------------------------------------------------
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('bookings')
      .select('*, hotel:hotels(*), car:cars(*), payment:payments(*)')
      .eq('booking_code', code)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // ถ้า user login แล้ว ให้ใช้ email จาก token ตรวจสอบ
    // ถ้าไม่ได้ login ให้ต้องส่ง email มาใน query param เสมอ
    const verifyEmail = userAuth.success ? userAuth.user?.email : email

    // Guest ต้องระบุ email เพื่อป้องกันเดารหัส booking
    if (!userAuth.success && !verifyEmail) {
      return NextResponse.json(
        { error: 'Email is required for booking lookup' },
        { status: 400 }
      )
    }

    if (!verifyEmail || data.customer_email.toLowerCase() !== verifyEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match booking record' },
        { status: 403 }
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// PATCH Handler - อัพเดทสถานะการจอง
// ============================================================

/**
 * อัพเดทข้อมูลการจอง (เฉพาะ Admin)
 *
 * @description
 *   - ต้องผ่านการยืนยันตัวตน Admin ก่อน
 *   - ใช้สำหรับอัพเดทสถานะการจอง
 *   - ใช้ Admin Client เพื่อข้าม RLS
 *
 * @param {Request} request - HTTP Request พร้อม body เป็นข้อมูลที่จะอัพเดท
 * @param {Params} params - Route parameters ที่มีรหัสการจอง
 * @returns {Promise<NextResponse>} ข้อมูลการจองที่อัพเดทแล้ว
 *
 * @example
 *   PATCH /api/bookings/BK-ABC123
 *   Body: { "status": "CONFIRMED" }
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    // ----------------------------------------------------------
    // ตรวจสอบสิทธิ์ Admin
    // ----------------------------------------------------------
    const auth = await verifyAdminToken()
    if (!auth.success) {
      return unauthorizedResponse('Admin access required')
    }

    // ดึงรหัสการจองและข้อมูลที่จะอัพเดท
    const { code } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    // ----------------------------------------------------------
    // Status Transition Validation
    // ----------------------------------------------------------
    if (body.status) {
      // ห้าม PATCH เป็น CANCELLED ตรง (ต้องใช้ /cancel endpoint)
      if (body.status === 'CANCELLED') {
        return NextResponse.json(
          { error: 'กรุณาใช้ endpoint /api/bookings/[code]/cancel สำหรับการยกเลิก' },
          { status: 400 }
        )
      }

      // ดึงสถานะปัจจุบัน
      const { data: current } = await supabase
        .from('bookings')
        .select('status')
        .eq('booking_code', code)
        .single()

      if (current) {
        const allowedTransitions = VALID_STATUS_TRANSITIONS[current.status] || []
        if (!allowedTransitions.includes(body.status)) {
          return NextResponse.json(
            { error: `ไม่สามารถเปลี่ยนสถานะจาก "${current.status}" เป็น "${body.status}" ได้` },
            { status: 400 }
          )
        }
      }
    }

    // Snapshot the before-state so the audit row records what
    // changed, not just the new value. Helpful for "wait, what
    // was the old status?" questions.
    const { data: before } = await supabase
      .from('bookings')
      .select('status, total_price, refund_amount, refund_status')
      .eq('booking_code', code)
      .single()

    const { data, error } = await supabase
      .from('bookings')
      .update(body)
      .eq('booking_code', code)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logAdminAction({
      actor: auth.user,
      request,
      action: body.status ? 'booking.status_change' : 'booking.update',
      resource_type: 'booking',
      resource_id: code,
      metadata: {
        before: before || null,
        changes: body,
      },
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
