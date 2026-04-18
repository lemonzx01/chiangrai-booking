/**
 * ============================================================
 * CSRF Protection — Double Submit Cookie Pattern
 * ============================================================
 *
 * How it works:
 *   1. issueCsrfToken() generates a random token, sets it as a
 *      Set-Cookie header (NOT httpOnly so JS can read it), and
 *      returns the token so the response can include it.
 *   2. The frontend reads the cookie and sends it back as the
 *      X-CSRF-Token header on every state-changing request.
 *   3. verifyCsrfToken(req) checks that the cookie value matches
 *      the header value. Same-origin requests pass; CSRF attacks
 *      from third-party origins cannot read the cookie and so
 *      cannot forge the header.
 *
 * Apply to: POST/PUT/PATCH/DELETE on routes that modify state
 *           AND require an authenticated session.
 *
 * Skip for: webhook routes (Stripe signature is sufficient),
 *           login/register/forgot-password (no session yet),
 *           public read endpoints.
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes, timingSafeEqual } from 'crypto'

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

function generate(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Issue a fresh CSRF token. Sets the cookie on the response and
 * returns the token (so a JSON body can echo it for clients that
 * cannot read non-httpOnly cookies easily).
 */
export async function issueCsrfToken(): Promise<string> {
  const token = generate()
  const cookieStore = await cookies()
  cookieStore.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false, // must be readable by JS to be sent as header
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 h
  })
  return token
}

/**
 * Verify that the CSRF token cookie matches the X-CSRF-Token header.
 * Returns null on success or a NextResponse(403) on failure.
 */
export async function verifyCsrfToken(req: NextRequest | Request): Promise<NextResponse | null> {
  // Skip CSRF on safe methods
  const method = req.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null
  }

  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value
  const headerToken = req.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      { error: 'CSRF token missing', code: 'CSRF_MISSING' },
      { status: 403 }
    )
  }

  // Constant-time comparison
  const a = Buffer.from(cookieToken)
  const b = Buffer.from(headerToken)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json(
      { error: 'CSRF token mismatch', code: 'CSRF_INVALID' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Higher-order helper: wrap a route handler so CSRF is verified before
 * the handler runs. Usage:
 *
 *   export const POST = withCsrf(async (req) => { ... })
 */
export function withCsrf<T extends (req: any, ctx?: any) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (req: any, ctx?: any) => {
    const failure = await verifyCsrfToken(req)
    if (failure) return failure
    return handler(req, ctx)
  }) as T
}
