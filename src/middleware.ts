/**
 * ============================================================
 * Next.js Middleware - ตัวกลางจัดการ Request
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ตรวจสอบ authentication สำหรับ admin routes
 *   - Rate limiting สำหรับ API routes
 *   - เพิ่ม Security headers
 *
 * Features:
 *   - JWT verification สำหรับ admin routes
 *   - Rate limiting (60 req/min general, 10 req/min auth)
 *   - Security headers (XSS, Clickjacking, MIME sniffing)
 *   - HSTS สำหรับ production
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Next.js Response utility */
import { NextResponse } from 'next/server'

/** Next.js Request type */
import type { NextRequest } from 'next/server'

/** JWT verification จาก jose library */
import { jwtVerify } from 'jose'

// ============================================================
// Constants - Protected Routes
// ============================================================

/**
 * รายการ admin routes ที่ต้องมี authentication
 */
const protectedAdminPaths = [
  '/admin/dashboard',
  '/admin/hotels',
  '/admin/cars',
  '/admin/bookings',
  '/admin/partners',
]

// ============================================================
// Rate Limiting Configuration
// ============================================================

/**
 * In-memory store สำหรับ rate limiting
 * หมายเหตุ: ใน production ควรใช้ Redis หรือ database
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/** Rate limit window (1 นาที) */
const RATE_LIMIT_WINDOW = 60 * 1000

/** จำนวน request สูงสุดต่อ window (general) */
const RATE_LIMIT_MAX_REQUESTS = 60

/** จำนวน request สูงสุดต่อ window (auth routes) */
const AUTH_RATE_LIMIT_MAX = 10

// ============================================================
// Helper Functions
// ============================================================

/**
 * ดึง JWT secret key
 *
 * @description
 *   ใน production ต้องมี JWT_SECRET จาก environment
 *   ใน development ใช้ default secret
 *
 * @returns {Uint8Array} Encoded JWT secret
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  // ตรวจสอบว่า production มี secret หรือไม่
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_SECRET is required in production')
  }

  return new TextEncoder().encode(
    secret || 'development-secret-key-change-in-production-12345'
  )
}

/**
 * ตรวจสอบ rate limit
 *
 * @description
 *   จำกัดจำนวน request ต่อ IP ต่อ time window
 *   Auth routes มี limit ที่เข้มงวดกว่า
 *
 * @param {string} ip - IP address ของผู้ใช้
 * @param {boolean} isAuthRoute - เป็น auth route หรือไม่
 * @returns {{ allowed: boolean; remaining: number }} สถานะ rate limit
 */
function checkRateLimit(ip: string, isAuthRoute: boolean): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const key = `${ip}-${isAuthRoute ? 'auth' : 'general'}`
  const limit = isAuthRoute ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS

  const record = rateLimitStore.get(key)

  // ----------------------------------------------------------
  // ถ้าไม่มี record หรือหมดเวลาแล้ว -> reset
  // ----------------------------------------------------------
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: limit - 1 }
  }

  // ----------------------------------------------------------
  // ถ้าเกิน limit -> reject
  // ----------------------------------------------------------
  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  // ----------------------------------------------------------
  // เพิ่ม count และ return
  // ----------------------------------------------------------
  record.count++
  return { allowed: true, remaining: limit - record.count }
}

/**
 * เพิ่ม Security headers ใน response
 *
 * @description
 *   ป้องกัน XSS, Clickjacking, MIME sniffing
 *   และ enforce HTTPS ใน production
 *
 * @param {NextResponse} response - Response object
 * @returns {NextResponse} Response พร้อม security headers
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // ป้องกัน Clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none'")

  // ป้องกัน MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection (สำหรับ legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self)'
  )

  // HSTS (เฉพาะ production ที่ใช้ HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}

// ============================================================
// Middleware Function
// ============================================================

/**
 * Next.js Middleware
 *
 * @description
 *   ทำงานก่อนทุก request
 *   จัดการ authentication, rate limiting, security headers
 *
 * @param {NextRequest} request - Request object
 * @returns {Promise<NextResponse>} Response หรือ redirect
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ----------------------------------------------------------
  // ดึง IP address ของผู้ใช้
  // ----------------------------------------------------------
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // ----------------------------------------------------------
  // ตรวจสอบประเภท route
  // ----------------------------------------------------------
  const isApiRoute = pathname.startsWith('/api')
  const isAuthRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/api/admin/login')

  // ----------------------------------------------------------
  // Rate Limiting สำหรับ API routes
  // ----------------------------------------------------------
  if (isApiRoute) {
    const { allowed, remaining } = checkRateLimit(ip, isAuthRoute)

    // ถ้าเกิน rate limit -> return 429
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW / 1000)),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    // เพิ่ม rate limit headers และ security headers
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return addSecurityHeaders(response)
  }

  // ----------------------------------------------------------
  // ตรวจสอบ admin routes ที่ต้อง authenticate
  // รวม /admin/partners และ /admin/hotels/*/room-types
  // ----------------------------------------------------------
  const isAdminRoute = protectedAdminPaths.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith('/admin/partners') ||
    pathname.match(/^\/admin\/hotels\/[^/]+\/room-types/)

  if (isAdminRoute) {
    const token = request.cookies.get('admin_token')?.value

    // ถ้าไม่มี token -> redirect ไป login
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      // ----------------------------------------------------------
      // Verify JWT token
      // ----------------------------------------------------------
      const secret = getJwtSecret()
      const { payload } = await jwtVerify(token, secret)

      // ตรวจสอบว่าเป็น admin หรือไม่
      if (payload.role !== 'admin') {
        throw new Error('Not an admin')
      }
    } catch {
      // Token ไม่ถูกต้องหรือหมดอายุ -> redirect ไป login
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_token')
      return response
    }
  }

  // ----------------------------------------------------------
  // เพิ่ม security headers สำหรับทุก response
  // ----------------------------------------------------------
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

// ============================================================
// Middleware Configuration
// ============================================================

/**
 * Middleware matcher configuration
 *
 * ทำงานกับทุก path ยกเว้น static files
 */
export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
