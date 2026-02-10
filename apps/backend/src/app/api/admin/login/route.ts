/**
 * ============================================================
 * Admin Login API Route - เข้าสู่ระบบ Admin
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - เข้าสู่ระบบสำหรับ Admin โดยเฉพาะ
 *   - ตรวจสอบรหัสผ่านด้วย bcrypt
 *   - สร้าง JWT token และเก็บใน HttpOnly cookie
 *
 * Endpoint:
 *   - POST /api/admin/login - เข้าสู่ระบบ Admin
 *
 * Request Body:
 *   - email: อีเมล Admin
 *   - password: รหัสผ่าน
 *
 * Security:
 *   - Password hashing ด้วย bcrypt
 *   - JWT token หมดอายุใน 24 ชั่วโมง
 *   - HttpOnly cookie ป้องกัน XSS
 *   - ตรวจสอบสถานะ is_active
 *
 * Note:
 *   - Route นี้ใช้สำหรับหน้า Admin Login โดยเฉพาะ
 *   - สำหรับ login ทั่วไปให้ใช้ /api/auth/login
 *
 * ============================================================
 */

export const dynamic = 'force-dynamic'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '@/lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันจัดการ cookies */
import { cookies } from 'next/headers'

/** Library สำหรับ hash password */
import bcrypt from 'bcryptjs'

/** Library สำหรับสร้าง JWT */
import { SignJWT } from 'jose'

/** ข้อมูล Mock Admin */
import { findMockAdmin } from '@/lib/mock-data'

/** ฟังก์ชันตรวจสอบสิทธิ์และ Mock Mode */
import { getJwtSecret, isMockMode } from '@/lib/auth'

// ============================================================
// POST Handler - เข้าสู่ระบบ Admin
// ============================================================

/**
 * เข้าสู่ระบบสำหรับ Admin
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบข้อมูล email และ password
 *   2. ค้นหา Admin จากตาราง admins
 *   3. ตรวจสอบว่า Admin is_active = true
 *   4. ยืนยันรหัสผ่านด้วย bcrypt
 *   5. อัพเดทเวลา last_login
 *   6. สร้าง JWT token
 *   7. เก็บ token ใน HttpOnly cookie
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} ข้อมูล Admin ที่ login
 *
 * @example
 *   POST /api/admin/login
 *   Body: { "email": "admin@example.com", "password": "admin123" }
 */
export async function POST(request: Request) {
  try {
    // ดึงข้อมูลจาก request body
    const body = await request.json()
    const { email, password } = body

    // ----------------------------------------------------------
    // ตรวจสอบข้อมูลที่จำเป็น
    // ----------------------------------------------------------
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // ============================================================
    // Mock Mode: ใช้ข้อมูลจำลอง
    // ============================================================
    if (isMockMode()) {
      // ค้นหา Mock Admin
      const mockAdmin = findMockAdmin(email)

      if (!mockAdmin) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // ตรวจสอบรหัสผ่าน (mock mode: admin123)
      const isValidPassword = password === 'admin123' ||
        await bcrypt.compare(password, mockAdmin.password_hash).catch(() => false)

      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // สร้าง JWT token
      const secret = getJwtSecret()
      const token = await new SignJWT({
        sub: mockAdmin.id,
        email: mockAdmin.email,
        name: mockAdmin.name,
        role: mockAdmin.role,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h') // หมดอายุใน 24 ชั่วโมง
        .setIssuedAt()
        .sign(secret)

      // เก็บ token ใน cookie
      const cookieStore = await cookies()
      cookieStore.set('admin_token', token, {
        httpOnly: true, // ป้องกัน XSS
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 ชั่วโมง
        path: '/',
      })

      return NextResponse.json({
        user: {
          id: mockAdmin.id,
          email: mockAdmin.email,
          name: mockAdmin.name,
          role: mockAdmin.role,
        },
      })
    }

    // ============================================================
    // Production Mode: ใช้ Supabase
    // ============================================================
    const supabase = await createAdminClient()

    // ----------------------------------------------------------
    // ค้นหา Admin จาก Database
    // ----------------------------------------------------------
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true) // ต้องเป็น Admin ที่ active เท่านั้น
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // ----------------------------------------------------------
    // ยืนยันรหัสผ่าน
    // ----------------------------------------------------------
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // ----------------------------------------------------------
    // อัพเดทเวลา login ล่าสุด
    // ----------------------------------------------------------
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    // ----------------------------------------------------------
    // สร้าง JWT Token
    // ----------------------------------------------------------
    const secret = getJwtSecret()
    const token = await new SignJWT({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .setIssuedAt()
      .sign(secret)

    // ----------------------------------------------------------
    // เก็บ token ใน cookie
    // ----------------------------------------------------------
    const cookieStore = await cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 ชั่วโมง
      path: '/',
    })

    return NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
