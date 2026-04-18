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
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server'

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
