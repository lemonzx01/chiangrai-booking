/**
 * ============================================================
 * Rate Limiting Middleware - จำกัดจำนวน requests
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ป้องกัน API abuse
 *   - จำกัดจำนวน requests ต่อ IP address
 *   - รองรับ payment endpoints ที่ต้องการความปลอดภัยสูง
 *
 * ============================================================
 */

// ============================================================
// Rate Limit Store (In-Memory)
// ============================================================

/**
 * Interface สำหรับเก็บข้อมูล rate limit
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * Rate limit store (in-memory)
 * Key: IP address
 * Value: Rate limit entry
 */
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Cleanup old entries ทุก 1 ชั่วโมง
 */
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(ip)
    }
  }
}, 60 * 60 * 1000) // 1 hour

// ============================================================
// Rate Limit Configuration
// ============================================================

/**
 * Rate limit configuration สำหรับแต่ละ endpoint
 */
export const RATE_LIMIT_CONFIG = {
  // Payment endpoints - จำกัดเข้มงวด
  '/api/checkout': {
    maxRequests: 10, // 10 requests
    windowMs: 60 * 1000, // 1 minute
  },
  '/api/payments': {
    maxRequests: 30, // 30 requests
    windowMs: 60 * 1000, // 1 minute
  },
  // Forgot password - จำกัดเพื่อป้องกัน spam
  '/api/auth/forgot-password': {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Resend verification - จำกัดเพื่อป้องกัน spam
  '/api/auth/resend-verification': {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Default สำหรับ endpoints อื่นๆ
  default: {
    maxRequests: 100, // 100 requests
    windowMs: 60 * 1000, // 1 minute
  },
} as const

// ============================================================
// Rate Limit Functions
// ============================================================

/**
 * ตรวจสอบว่า IP address เกิน rate limit หรือไม่
 *
 * @param ip - IP address
 * @param endpoint - API endpoint path
 * @returns Object ที่มี allowed และ remaining requests
 *
 * @example
 * const { allowed, remaining } = checkRateLimit('192.168.1.1', '/api/checkout')
 * if (!allowed) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 * }
 */
export function checkRateLimit(
  ip: string,
  endpoint: string
): { allowed: boolean; remaining: number; resetTime: number } {
  // หา config สำหรับ endpoint นี้
  const config =
    RATE_LIMIT_CONFIG[endpoint as keyof typeof RATE_LIMIT_CONFIG] ||
    RATE_LIMIT_CONFIG.default

  const now = Date.now()
  const entry = rateLimitStore.get(ip)

  // ถ้ายังไม่มี entry หรือ reset time ผ่านไปแล้ว ให้สร้างใหม่
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  // เพิ่ม count
  entry.count++

  // ตรวจสอบว่าเกิน limit หรือไม่
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * ดึง IP address จาก request
 *
 * @param request - HTTP Request object
 * @returns IP address
 */
export function getClientIP(request: Request): string {
  // ตรวจสอบ headers สำหรับ IP address
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for อาจมีหลาย IP (proxy chain)
    // ใช้ IP แรก
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback: ใช้ 'unknown' ถ้าหา IP ไม่ได้
  return 'unknown'
}

/**
 * Rate limit middleware สำหรับ Next.js API routes
 *
 * @param request - HTTP Request object
 * @param endpoint - API endpoint path
 * @returns NextResponse with 429 status ถ้าเกิน rate limit, null ถ้าผ่าน
 *
 * @example
 * // ใน API route
 * const rateLimitResponse = rateLimitMiddleware(request, '/api/checkout')
 * if (rateLimitResponse) {
 *   return rateLimitResponse
 * }
 */
export function rateLimitMiddleware(
  request: Request,
  endpoint: string
): Response | null {
  const ip = getClientIP(request)
  const { allowed, remaining, resetTime } = checkRateLimit(ip, endpoint)

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT_CONFIG[endpoint as keyof typeof RATE_LIMIT_CONFIG]
            ?.maxRequests.toString() || RATE_LIMIT_CONFIG.default.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  // Return null ถ้าผ่าน rate limit (ไม่ต้อง block)
  return null
}
