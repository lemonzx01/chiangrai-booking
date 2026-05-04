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
 * Storage strategies:
 *   - In-memory Map (default, dev only — does NOT survive across
 *     serverless function instances)
 *   - Vercel KV (production: set KV_REST_API_URL + KV_REST_API_TOKEN
 *     and Vercel KV will be used automatically)
 *
 * Use rateLimitAsync(req, endpoint) for production code paths.
 * The legacy sync rateLimitMiddleware() is kept for backward compat.
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
  // Register - prevents bulk-signup attacks. Now especially
  // important since signup triggers a referral notification
  // email; without a cap, an attacker can bomb a target user's
  // inbox by registering many accounts with their ?ref code.
  // 5 per hour per IP is plenty for legitimate use (a household
  // signing up multiple family members) but kills automation.
  '/api/auth/register': {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Login - protects against credential-stuffing on top of the
  // per-account lockout. Generous because legitimate users do
  // mistype passwords.
  '/api/auth/login': {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Loyalty redeem - the endpoint runs an atomic decrement +
  // coupon insert. Without a cap a malicious script could spam
  // it to either probe the race-lost path or just churn the DB.
  // 10/hr/IP is plenty for a real human (you'd never redeem
  // more than once or twice in a session) but kills automation.
  '/api/user/loyalty/redeem': {
    maxRequests: 10,
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
 * Build the rate-limit bucket identifier.
 *
 * If the caller has an auth cookie (admin/partner/user), key
 * by a HASH of the cookie value so:
 *   1. Authenticated users get a stable per-account bucket
 *      regardless of which IP they're connecting from. Stops
 *      "rotate IPs to brute-force one account" attacks.
 *   2. Anonymous callers fall back to IP — same as before.
 *
 * Why hash instead of decode + use sub:
 *   Decoding the JWT payload (without verifying) is fast but
 *   trusts attacker-supplied input. A forged token could pick
 *   a victim's user_id and exhaust their bucket, locking them
 *   out. Hashing the raw cookie value means a forger gets
 *   their OWN bucket — exactly like a different IP — and the
 *   real user is unaffected.
 *
 * Hash uses HMAC-SHA256 with JWT_SECRET so the bucket name
 * isn't directly recoverable from the cookie. Truncate to 16
 * hex chars — 64 bits is plenty for collision avoidance at
 * our scale.
 */
import { createHmac } from 'crypto'

export function getRateLimitIdentity(request: Request): string {
  const cookieHeader = request.headers.get('cookie') || ''

  // Match in priority order — admin > partner > user — so that
  // an admin who happens to also have a stale user cookie gets
  // bucketed by their admin identity (separate quota).
  const adminMatch = /(?:^|;\s*)admin_token=([^;]+)/.exec(cookieHeader)
  const partnerMatch = /(?:^|;\s*)partner_token=([^;]+)/.exec(cookieHeader)
  const userMatch = /(?:^|;\s*)user_token=([^;]+)/.exec(cookieHeader)

  const found =
    (adminMatch && { kind: 'admin', token: adminMatch[1] }) ||
    (partnerMatch && { kind: 'partner', token: partnerMatch[1] }) ||
    (userMatch && { kind: 'user', token: userMatch[1] }) ||
    null

  if (found) {
    const secret =
      process.env.JWT_SECRET ||
      'rate-limit-fallback-secret-only-for-dev-mock-mode'
    const hash = createHmac('sha256', secret)
      .update(found.token)
      .digest('hex')
      .slice(0, 16)
    return `${found.kind}:${hash}`
  }

  // No auth → fall back to IP
  return `ip:${getClientIP(request)}`
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
  // Per-user bucketing when authenticated, else per-IP. See
  // getRateLimitIdentity for why hashing the cookie beats
  // decoding the JWT subject.
  const identity = getRateLimitIdentity(request)
  const { allowed, remaining, resetTime } = checkRateLimit(identity, endpoint)

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

// ============================================================
// KV-backed (production) implementation
// ============================================================

/**
 * Detect whether Vercel KV is configured.
 * KV_REST_API_URL + KV_REST_API_TOKEN come from `vercel kv create`.
 */
function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

interface KvCheckResult {
  count: number
  ttlSeconds: number
}

/**
 * Atomically increment a key in Vercel KV using INCR + EXPIRE NX.
 * Falls back gracefully on errors (returns count=0 to fail-open).
 */
async function kvIncrement(key: string, windowSeconds: number): Promise<KvCheckResult> {
  const url = process.env.KV_REST_API_URL!
  const token = process.env.KV_REST_API_TOKEN!

  try {
    // Pipeline: INCR + EXPIRE (NX = only if no TTL set yet)
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSeconds), 'NX'],
        ['TTL', key],
      ]),
      // Fail fast — rate limiting must not block requests for long
      signal: AbortSignal.timeout(2000),
    })

    if (!res.ok) {
      return { count: 0, ttlSeconds: windowSeconds }
    }

    const data: any = await res.json()
    // pipeline response: array of { result } objects
    const count = Number(data?.[0]?.result ?? 0)
    const ttl = Number(data?.[2]?.result ?? windowSeconds)
    return { count, ttlSeconds: ttl > 0 ? ttl : windowSeconds }
  } catch {
    // Fail open — better to allow than to break the app
    return { count: 0, ttlSeconds: windowSeconds }
  }
}

/**
 * Production-grade rate limit check.
 *
 * Uses Vercel KV when configured, otherwise falls back to the
 * in-memory implementation. Returns the same NextResponse(429) shape
 * as rateLimitMiddleware() so it can be a drop-in replacement.
 */
export async function rateLimitAsync(
  request: Request,
  endpoint: string
): Promise<Response | null> {
  if (!isKvConfigured()) {
    // Fall back to in-memory
    return rateLimitMiddleware(request, endpoint)
  }

  const config =
    RATE_LIMIT_CONFIG[endpoint as keyof typeof RATE_LIMIT_CONFIG] ||
    RATE_LIMIT_CONFIG.default

  const identity = getRateLimitIdentity(request)
  const windowSeconds = Math.ceil(config.windowMs / 1000)
  const key = `rl:${endpoint}:${identity}`

  const { count, ttlSeconds } = await kvIncrement(key, windowSeconds)

  if (count > config.maxRequests) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + ttlSeconds * 1000).toISOString(),
          'Retry-After': String(ttlSeconds),
        },
      }
    )
  }

  return null
}
