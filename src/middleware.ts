import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Protected admin routes
const protectedAdminPaths = [
  '/admin/dashboard',
  '/admin/hotels',
  '/admin/cars',
  '/admin/bookings',
]

// Rate limiting store (in-memory, resets on server restart)
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit config
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // max requests per window
const AUTH_RATE_LIMIT_MAX = 10 // stricter limit for auth endpoints

// Get JWT secret with production check
function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_SECRET is required in production')
  }
  return new TextEncoder().encode(
    secret || 'development-secret-key-change-in-production-12345'
  )
}

// Check rate limit
function checkRateLimit(ip: string, isAuthRoute: boolean): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const key = `${ip}-${isAuthRoute ? 'auth' : 'general'}`
  const limit = isAuthRoute ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS

  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}

// Add security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none'")

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self)'
  )

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'

  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api')
  const isAuthRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/api/admin/login')

  // Rate limiting for API routes
  if (isApiRoute) {
    const { allowed, remaining } = checkRateLimit(ip, isAuthRoute)

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

    // Add rate limit headers to API responses
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return addSecurityHeaders(response)
  }

  // Check if this is a protected admin route
  if (protectedAdminPaths.some((path) => pathname.startsWith(path))) {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const secret = getJwtSecret()
      const { payload } = await jwtVerify(token, secret)

      // Verify it's an admin token
      if (payload.role !== 'admin') {
        throw new Error('Not an admin')
      }
    } catch {
      // Token is invalid or expired
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_token')
      return response
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
