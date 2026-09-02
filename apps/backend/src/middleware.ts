/**
 * ============================================================
 * Next.js Middleware - Request Correlation IDs
 * ============================================================
 *
 * Runs on every API request before reaching the handler.
 *
 * วัตถุประสงค์:
 *   - ออก x-request-id ให้ทุก request (UUID v4)
 *   - ส่งกลับเป็น response header เพื่อให้ client เห็น
 *   - หากผู้เรียกส่ง x-request-id มาแล้ว เราจะ honor มัน
 *     (ใช้สำหรับ distributed tracing)
 *
 * ดู `lib/logger.ts → requestLogger()` ที่อ่าน header นี้และ
 * bind เข้ากับทุก log line ของ request นั้น
 *
 * นอกจากนี้ยังออก CSRF token cookie ให้ทุก response ที่ยังไม่มี
 * (double-submit cookie pattern — ดู lib/csrf.ts)
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * CSRF cookie name — must match CSRF_COOKIE_NAME in lib/csrf.ts.
 * Duplicated rather than imported because middleware runs on the Edge
 * runtime and lib/csrf.ts pulls in node:crypto and next/headers.
 */
const CSRF_COOKIE_NAME = 'csrf_token'

/**
 * Generate a 32-byte token as hex, using Web Crypto.
 *
 * lib/csrf.ts uses node:crypto randomBytes, which is unavailable on the
 * Edge runtime; getRandomValues is the equivalent CSPRNG there and
 * produces an interchangeable value (the verifier only compares the
 * cookie against the header, it does not care how it was minted).
 */
function generateCsrfToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function middleware(req: NextRequest) {
  // Honor incoming x-request-id (so a frontend that already
  // generated one can correlate with backend logs).
  const incoming = req.headers.get('x-request-id')
  const requestId =
    incoming && incoming.length <= 128 ? incoming : crypto.randomUUID()

  // Forward the (possibly newly minted) header into the request
  // so that handlers and `requestLogger(req)` see it.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-request-id', requestId)

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Echo it back to the client.
  res.headers.set('x-request-id', requestId)

  // ------------------------------------------------------------
  // Issue the CSRF token cookie if the caller doesn't have one.
  // ------------------------------------------------------------
  // lib/csrf.ts implements double-submit verification and exports
  // issueCsrfToken(), but nothing ever called it — so the cookie was
  // never set, getCsrfToken() in the frontend always returned null,
  // no X-CSRF-Token header was ever sent, and every route guarded by
  // withCsrf/verifyCsrfToken answered 403 CSRF_MISSING. That silently
  // broke booking cancellation, refunds, reschedules, manual bookings,
  // campaigns, partner availability and wishlist writes.
  //
  // Issuing here rather than at login covers three cases at once:
  // sessions created before this change, anonymous callers hitting
  // guarded public endpoints, and the login response itself (middleware
  // runs on that request too, so the token is present immediately after
  // signing in — before the user can reach any mutating action).
  //
  // httpOnly is deliberately false: the double-submit pattern requires
  // client JS to read the cookie and echo it back in a header. That is
  // safe because the token is not a credential — an attacker's origin
  // still cannot read it cross-site, which is the whole point.
  if (!req.cookies.get(CSRF_COOKIE_NAME)) {
    res.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: generateCsrfToken(),
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 h — matches issueCsrfToken()
    })
  }

  return res
}

/**
 * Match all API routes (skip _next, static, images).
 * Excludes the static asset paths so middleware doesn't run on
 * /favicon.ico, /_next/static/*, etc.
 */
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico (favicon)
     * - /robots.txt, /sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
