/**
 * ============================================================
 * Auth Login API Route - ระบบเข้าสู่ระบบรวม
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ระบบเข้าสู่ระบบรวมสำหรับทั้ง User และ Admin
 *   - ตรวจสอบรหัสผ่านด้วย bcrypt
 *   - สร้าง JWT token และเก็บใน HttpOnly cookie
 *
 * Endpoint:
 *   - POST /api/auth/login - เข้าสู่ระบบ
 *
 * Request Body:
 *   - email: อีเมลผู้ใช้
 *   - password: รหัสผ่าน
 *
 * Flow:
 *   1. ตรวจสอบว่าเป็น Admin หรือไม่
 *   2. ถ้าไม่ใช่ Admin ให้ตรวจสอบว่าเป็น User หรือไม่
 *   3. ยืนยันรหัสผ่าน
 *   4. สร้าง JWT token
 *   5. เก็บ token ใน cookie
 *
 * Security:
 *   - Password hashing ด้วย bcrypt
 *   - JWT token พร้อม expiration
 *   - HttpOnly cookie ป้องกัน XSS
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** ฟังก์ชันจัดการ cookies */
import { cookies } from 'next/headers'

/** Library สำหรับ hash password */
import bcrypt from 'bcryptjs'

/** Library สำหรับสร้าง JWT */
import { SignJWT } from 'jose'

/** ฟังก์ชันตรวจสอบสิทธิ์และ Mock Mode */
import { getJwtSecret, isMockMode } from '@/lib/auth'

/** ข้อมูล Mock สำหรับการทดสอบ */
import { findMockUser, findMockAdmin } from '@/lib/mock-data'

/** Account lockout (brute-force protection) */
import { checkLockout, recordAttempt, getClientIp } from '@/lib/lockout'

/** Structured logger */
import { logger } from '@/lib/logger'
import { rateLimitAsync } from '../../../../middleware/rate-limit'

// ============================================================
// POST Handler - เข้าสู่ระบบ
// ============================================================

/**
 * ระบบเข้าสู่ระบบรวมสำหรับ User และ Admin
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ตรวจสอบว่า email อยู่ในตาราง admins หรือไม่
 *   2. ถ้าเป็น Admin: ยืนยันรหัสผ่าน สร้าง admin_token
 *   3. ถ้าไม่ใช่: ตรวจสอบในตาราง users
 *   4. ถ้าเป็น User: ยืนยันรหัสผ่าน สร้าง user_token
 *   5. เก็บ token ใน HttpOnly cookie
 *
 * @param {Request} request - HTTP Request object
 * @returns {Promise<NextResponse>} ข้อมูลผู้ใช้ที่ login
 *
 * @example
 *   POST /api/auth/login
 *   Body: { "email": "user@example.com", "password": "password123" }
 */
export async function POST(request: Request) {
  // ----------------------------------------------------------
  // Rate limit
  // ----------------------------------------------------------
  // Credential-stuffing cap on top of the per-account lockout below.
    // Lockout protects one account; this protects the whole account
    // list from being sprayed one attempt at a time.
  const limitResponse = await rateLimitAsync(request, '/api/auth/login')
  if (limitResponse) return limitResponse

  try {
    // ดึงข้อมูลจาก request body
    const body = await request.json()
    const { email, password } = body

    // ----------------------------------------------------------
    // ตรวจสอบข้อมูลที่จำเป็น
    // ----------------------------------------------------------
    if (!email || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      )
    }

    // ----------------------------------------------------------
    // Brute-force protection: check lockout BEFORE any DB lookup
    // ----------------------------------------------------------
    const ip = getClientIp(request)
    const lockoutStatus = await checkLockout(email)
    if (lockoutStatus.locked) {
      return NextResponse.json(
        { error: lockoutStatus.reason, retryAfter: lockoutStatus.retryAfterSeconds },
        {
          status: 429,
          headers: {
            'Retry-After': String(lockoutStatus.retryAfterSeconds || 1800),
          },
        }
      )
    }

    // Helper to record + return failure
    const fail = async (reason = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง') => {
      await recordAttempt(email, ip, false, request.headers.get('user-agent'))
      return NextResponse.json({ error: reason }, { status: 401 })
    }
    const ok = async () => {
      await recordAttempt(email, ip, true, request.headers.get('user-agent'))
    }

    // เตรียม cookie store และ JWT secret
    const cookieStore = await cookies()
    const secret = getJwtSecret()

    // ============================================================
    // Mock Mode: ใช้ข้อมูลจำลอง
    // ============================================================
    if (isMockMode()) {
      // ----------------------------------------------------------
      // ตรวจสอบว่าเป็น Admin หรือไม่
      // ----------------------------------------------------------
      const mockAdmin = findMockAdmin(email)

      if (mockAdmin) {
        // ตรวจสอบรหัสผ่าน Admin (mock mode: admin123)
        const isValidPassword = password === 'admin123' ||
          await bcrypt.compare(password, mockAdmin.password_hash).catch(() => false)

        if (!isValidPassword) {
          return fail()
        }
        await ok()

        // สร้าง JWT token สำหรับ Admin
        const token = await new SignJWT({
          sub: mockAdmin.id,
          email: mockAdmin.email,
          name: mockAdmin.name,
          role: 'admin',
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('24h') // หมดอายุใน 24 ชั่วโมง
          .setIssuedAt()
          .sign(secret)

        // เก็บ token ใน cookie
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
            role: 'admin',
          },
        })
      }

      // ----------------------------------------------------------
      // ตรวจสอบว่าเป็น User หรือไม่
      // ----------------------------------------------------------
      const mockUser = findMockUser(email)

      if (!mockUser) {
        return fail()
      }

      // ตรวจสอบรหัสผ่าน User
      let isValidPassword = false

      // สำหรับ default mock user ยอมรับ 'user123'
      if (mockUser.email === 'user@example.com' && password === 'user123') {
        isValidPassword = true
      } else {
        // สำหรับ user ที่สมัครใหม่ เทียบกับ hashed password
        if (!mockUser.password_hash) {
          logger.warn('login: user has no password_hash', { email })
          return fail()
        }
        isValidPassword = await bcrypt.compare(password, mockUser.password_hash).catch((err) => {
          logger.error('bcrypt.compare error', { error: err })
          return false
        })
      }

      if (!isValidPassword) {
        return fail()
      }
      await ok()

      const mockUserRole =
        mockUser.role === 'partner' || mockUser.role === 'admin' ? mockUser.role : 'user'

      // สร้าง JWT token สำหรับ User/Partner
      const token = await new SignJWT({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUserRole,
        type: mockUserRole,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d') // หมดอายุใน 7 วัน
        .setIssuedAt()
        .sign(secret)

      // เก็บ token ใน cookie
      cookieStore.set('user_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 วัน
        path: '/',
      })

      return NextResponse.json({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUserRole,
        },
      })
    }

    // ============================================================
    // Production Mode: ใช้ Supabase
    // ============================================================
    const supabase = await createAdminClient()

    // ----------------------------------------------------------
    // ตรวจสอบว่าเป็น Admin หรือไม่
    // ----------------------------------------------------------
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (admin) {
      // ยืนยันรหัสผ่าน Admin
      const isValidPassword = await bcrypt.compare(password, admin.password_hash)

      if (!isValidPassword) {
        return fail()
      }
      await ok()

      // อัพเดทเวลา login ล่าสุด (non-blocking)
      supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id)
        .then(({ error: updateError }: { error: any }) => {
          if (updateError) {
            logger.error('admin last_login update failed', { error: updateError })
          }
        })

      // สร้าง JWT token สำหรับ Admin
      const token = await new SignJWT({
        sub: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .setIssuedAt()
        .sign(secret)

      // เก็บ token ใน cookie
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
          role: 'admin',
        },
      })
    }

    // ----------------------------------------------------------
    // ตรวจสอบว่าเป็น User หรือไม่
    // ----------------------------------------------------------
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return fail()
    }

    const userRole = user.role === 'partner' || user.role === 'admin' ? user.role : 'user'

    if (!user.password_hash) {
      return fail()
    }

    // ยืนยันรหัสผ่าน User
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return fail()
    }
    await ok()

    // สร้าง JWT token สำหรับ User/Partner
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
      type: userRole,
      email_verified: user.email_verified || false,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret)

    // เก็บ token ใน cookie
    cookieStore.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
      path: '/',
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
        email_verified: user.email_verified || false,
      },
    })
  } catch (error) {
    logger.error('login error', { error })
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
