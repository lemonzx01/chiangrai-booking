/**
 * ============================================================
 * Auth - ระบบยืนยันตัวตนและ JWT Token
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - จัดการ JWT Token สำหรับ Authentication
 *   - ตรวจสอบสิทธิ์ Admin และ User
 *   - ฟังก์ชันช่วยเหลือสำหรับ Authentication
 *
 * การทำงานหลัก:
 *   - getJwtSecret(): ดึง JWT secret key
 *   - verifyAdminToken(): ตรวจสอบ token ของแอดมิน
 *   - verifyUserToken(): ตรวจสอบ token ของผู้ใช้
 *   - createToken(): สร้าง JWT token ใหม่
 *   - isMockMode(): ตรวจสอบว่าอยู่ในโหมด mock หรือไม่
 *
 * ============================================================
 */

// ============================================================
// Imports
// ============================================================

import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { NextResponse } from 'next/server'

// ============================================================
// JWT Configuration (การตั้งค่า JWT)
// ============================================================

/**
 * ดึง JWT Secret Key
 *
 * @description ดึง secret key สำหรับเข้ารหัส/ถอดรหัส JWT
 *              - ใน Production: ต้องตั้งค่า JWT_SECRET environment variable
 *              - ใน Development: ใช้ค่า fallback (ไม่ปลอดภัย)
 *
 * @returns Uint8Array ของ secret key
 * @throws Error ถ้าอยู่ใน production แต่ไม่ได้ตั้งค่า JWT_SECRET
 *
 * @example
 * const secret = getJwtSecret()
 * // ใช้กับ jose library
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    // Mock mode fallback: allow dev to boot without JWT_SECRET set.
    // Production should always set JWT_SECRET explicitly (enforced by /api/health check).
    if (isMockMode()) {
      return new TextEncoder().encode(
        'mock-mode-dev-secret-not-for-production-use-only-0123456789abcdef'
      )
    }
    throw new Error('JWT_SECRET environment variable is required')
  }

  if (secret.length < 32) {
    console.warn('[WARN] JWT_SECRET should be at least 32 characters for security')
  }

  return new TextEncoder().encode(secret)
}

// ============================================================
// Token Verification (ตรวจสอบ Token)
// ============================================================

/**
 * ตรวจสอบ Token ของแอดมิน
 *
 * @description ตรวจสอบ JWT token จาก cookie 'admin_token'
 *              และยืนยันว่าเป็นแอดมินจริง (role === 'admin')
 *
 * @returns Object ที่มี:
 *          - success: boolean - ผลการตรวจสอบ
 *          - user: ข้อมูลแอดมิน (ถ้าสำเร็จ)
 *          - error: ข้อความ error (ถ้าล้มเหลว)
 *
 * @example
 * const result = await verifyAdminToken()
 * if (result.success) {
 *   console.log(result.user.email)
 * }
 */
export async function verifyAdminToken() {
  try {
    // ดึง token จาก cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    // ตรวจสอบว่ามี token หรือไม่
    if (!token) {
      return { success: false, error: 'No token provided' }
    }

    // ตรวจสอบ JWT token
    const { payload } = await jwtVerify(token, getJwtSecret())

    // ตรวจสอบว่า role เป็น admin หรือไม่
    if (payload.role !== 'admin') {
      return { success: false, error: 'Not an admin' }
    }

    // คืนข้อมูลแอดมิน
    return {
      success: true,
      user: {
        id: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as string,
      }
    }
  } catch {
    // Token ไม่ถูกต้องหรือหมดอายุ
    return { success: false, error: 'Invalid token' }
  }
}

/**
 * ตรวจสอบ Token ของผู้ใช้งาน
 *
 * @description ตรวจสอบ JWT token จาก cookie 'user_token'
 *              สำหรับผู้ใช้งานทั่วไป (ไม่ใช่แอดมิน)
 *
 * @returns Object ที่มี:
 *          - success: boolean - ผลการตรวจสอบ
 *          - user: ข้อมูลผู้ใช้ (ถ้าสำเร็จ)
 *          - error: ข้อความ error (ถ้าล้มเหลว)
 *
 * @example
 * const result = await verifyUserToken()
 * if (result.success) {
 *   console.log(result.user.name)
 * }
 */
export async function verifyUserToken() {
  try {
    // ดึง token จาก cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')?.value

    // ตรวจสอบว่ามี token หรือไม่
    if (!token) {
      return { success: false, error: 'No token provided' }
    }

    // ตรวจสอบ JWT token
    const { payload } = await jwtVerify(token, getJwtSecret())

    // คืนข้อมูลผู้ใช้
    return {
      success: true,
      user: {
        id: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string,
        email_verified: (payload.email_verified as boolean) || false,
      }
    }
  } catch {
    // Token ไม่ถูกต้องหรือหมดอายุ
    return { success: false, error: 'Invalid token' }
  }
}

// ============================================================
// Token Creation (สร้าง Token)
// ============================================================

/**
 * สร้าง JWT Token
 *
 * @description สร้าง JWT token ใหม่พร้อม payload ที่กำหนด
 *              ใช้ algorithm HS256
 *
 * @param payload - ข้อมูลที่จะเก็บใน token
 * @param expiresIn - ระยะเวลาหมดอายุ (default: '7d' = 7 วัน)
 * @returns JWT token string
 *
 * @example
 * const token = await createToken({
 *   sub: user.id,
 *   email: user.email,
 *   name: user.name,
 *   role: 'admin'
 * }, '24h')
 */
export async function createToken(payload: Record<string, unknown>, expiresIn: string = '7d') {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' }) // ใช้ algorithm HS256
    .setExpirationTime(expiresIn) // กำหนดเวลาหมดอายุ
    .setIssuedAt() // บันทึกเวลาที่สร้าง
    .sign(getJwtSecret()) // เซ็นด้วย secret key

  return token
}

// ============================================================
// Response Helpers (ฟังก์ชันช่วยสร้าง Response)
// ============================================================

/**
 * สร้าง Response สำหรับกรณี Unauthorized
 *
 * @description สร้าง NextResponse พร้อม status 401
 *              ใช้เมื่อผู้ใช้ไม่มีสิทธิ์เข้าถึง
 *
 * @param message - ข้อความ error (default: 'Unauthorized')
 * @returns NextResponse object
 *
 * @example
 * if (!isAuthenticated) {
 *   return unauthorizedResponse('กรุณาเข้าสู่ระบบ')
 * }
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}

// ============================================================
// Environment Helpers (ฟังก์ชันตรวจสอบ Environment)
// ============================================================

/**
 * ตรวจสอบว่าอยู่ในโหมด Mock หรือไม่
 *
 * @description ตรวจสอบว่า Supabase ถูกตั้งค่าหรือไม่
 *              ถ้าไม่ได้ตั้งค่า จะใช้ Mock data แทน
 *
 * @returns true ถ้าอยู่ในโหมด mock, false ถ้าใช้ Supabase จริง
 *
 * @example
 * if (isMockMode()) {
 *   // ใช้ mock data
 * } else {
 *   // ใช้ Supabase
 * }
 */
export function isMockMode() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // ถือว่าเป็น mock mode ถ้า:
  // 1. ไม่มี SUPABASE_URL
  // 2. URL เป็น placeholder
  // 3. URL เป็น string ว่าง
  const looksUnconfigured =
    !supabaseUrl ||
    supabaseUrl === 'https://placeholder.supabase.co' ||
    supabaseUrl === ''

  if (!looksUnconfigured) return false

  // ------------------------------------------------------------
  // Fail closed in production.
  // ------------------------------------------------------------
  // Mock mode is a *development* affordance: it accepts hardcoded
  // passwords ('admin123'), skips Stripe signature verification and
  // serves an in-memory database. Deciding to enable all of that
  // purely because an env var is missing means one forgotten
  // NEXT_PUBLIC_SUPABASE_URL on a production deploy silently turns
  // the site into an open admin panel.
  //
  // So in production we refuse to infer it. An operator who genuinely
  // wants a mock production deploy (a demo/staging box) has to say so
  // out loud with ALLOW_MOCK_MODE=true.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_MODE !== 'true') {
    warnMockModeRefusedOnce()
    return false
  }

  return true
}

/**
 * Log the "refused to enable mock mode" warning at most once per
 * process, so a misconfigured deploy is loud in the logs without
 * flooding them on every single request.
 */
let mockModeWarningEmitted = false
function warnMockModeRefusedOnce() {
  if (mockModeWarningEmitted) return
  mockModeWarningEmitted = true
  console.error(
    '[SECURITY] NEXT_PUBLIC_SUPABASE_URL is not configured but NODE_ENV=production. ' +
      'Refusing to fall back to mock mode (which accepts hardcoded credentials). ' +
      'Configure Supabase, or set ALLOW_MOCK_MODE=true if this is an intentional demo deploy.'
  )
}

/**
 * ตรวจสอบว่า Stripe อยู่ในโหมด Mock หรือไม่
 *
 * @description true ถ้าไม่มี STRIPE_SECRET_KEY หรือเป็น placeholder
 *              เมื่อ mock mode: checkout/refund/webhook จะใช้ fake data
 */
export function isStripeMockMode() {
  const key = process.env.STRIPE_SECRET_KEY
  const looksUnconfigured =
    !key || key === '' || key.startsWith('sk_test_mock') || key === 'placeholder'

  if (!looksUnconfigured) return false

  // Same fail-closed rule as isMockMode(): Stripe mock mode disables
  // webhook signature verification, so a missing STRIPE_SECRET_KEY in
  // production would let anyone POST a forged `checkout.session.completed`
  // and mark their own booking paid. Require the explicit opt-in.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_MODE !== 'true') {
    return false
  }

  return true
}

/**
 * ตรวจสอบว่า Email service อยู่ในโหมด Mock หรือไม่
 *
 * @description true ถ้าไม่มีทั้ง RESEND_API_KEY และ BREVO_API_KEY
 *              เมื่อ mock mode: email จะถูก log แทนที่จะส่งจริง
 */
export function isEmailMockMode() {
  return !process.env.RESEND_API_KEY && !process.env.BREVO_API_KEY
}

/**
 * ดึงสถานะ mock mode ของทุก service (สำหรับ /api/health)
 */
export function getMockModeStatus() {
  return {
    supabase: isMockMode(),
    stripe: isStripeMockMode(),
    email: isEmailMockMode(),
  }
}

// ============================================================
// Partner Verification (ตรวจสอบ Partner Token)
// ============================================================

/**
 * ตรวจสอบ Token ของ Partner
 *
 * @description ตรวจสอบ JWT token และยืนยันว่าเป็น partner (role === 'partner')
 *
 * @returns Object ที่มี:
 *          - success: boolean - ผลการตรวจสอบ
 *          - user: ข้อมูล partner (ถ้าสำเร็จ)
 *          - error: ข้อความ error (ถ้าล้มเหลว)
 *
 * @example
 * const result = await verifyPartnerToken()
 * if (result.success) {
 *   console.log(result.user.id)
 * }
 */
export async function verifyPartnerToken() {
  try {
    // ดึง token จาก cookie
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const userToken = cookieStore.get('user_token')?.value
    const token = adminToken || userToken

    // ตรวจสอบว่ามี token หรือไม่
    if (!token) {
      return { success: false, error: 'No token provided' }
    }

    // ตรวจสอบ JWT token
    const { payload } = await jwtVerify(token, getJwtSecret())

    // ตรวจสอบว่า role เป็น partner หรือ admin (admin สามารถเข้าถึงได้)
    const role = (payload.role as string) || (payload.type as string)
    if (role !== 'partner' && role !== 'admin') {
      return { success: false, error: 'Not a partner or admin' }
    }

    // คืนข้อมูล partner
    return {
      success: true,
      user: {
        id: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string,
        role: role,
      }
    }
  } catch {
    // Token ไม่ถูกต้องหรือหมดอายุ
    return { success: false, error: 'Invalid token' }
  }
}

// ============================================================
// User Role Helper (ฟังก์ชันช่วยเหลือสำหรับ Role)
// ============================================================

/**
 * ดึง Role ของ User จาก Token
 *
 * @description ดึง role จาก JWT token (รองรับทั้ง admin_token และ user_token)
 *
 * @returns role ของ user ('admin', 'partner', 'user') หรือ null
 *
 * @example
 * const role = await getUserRole()
 * if (role === 'partner') {
 *   // Partner logic
 * }
 */
export async function getUserRole(): Promise<'admin' | 'partner' | 'user' | null> {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')?.value
    const userToken = cookieStore.get('user_token')?.value
    const token = adminToken || userToken

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, getJwtSecret())
    const role = (payload.role as string) || (payload.type as string) || 'user'
    
    if (role === 'admin' || role === 'partner' || role === 'user') {
      return role as 'admin' | 'partner' | 'user'
    }

    return 'user' // default
  } catch {
    return null
  }
}