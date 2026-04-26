/**
 * ============================================================
 * Cache header helpers for Next.js Route Handlers
 * ============================================================
 *
 * Why this exists:
 *   Public listing endpoints (/api/hotels, /api/cars) are hit
 *   on every page render of the matching route. They return
 *   the same data to every visitor, so caching at the CDN
 *   edge is a massive win — Vercel's edge will serve the
 *   bytes without invoking a function at all.
 *
 *   Conversely, anything that depends on the caller (a logged-in
 *   user's bookings, admin dashboards) MUST opt out so a
 *   misconfigured cache layer doesn't leak data.
 *
 * Usage:
 *   import { withPublicCache, withPrivateNoStore } from '@/lib/cache'
 *
 *   export async function GET() {
 *     const data = ...
 *     return withPublicCache(NextResponse.json(data))
 *   }
 *
 * Cache directives in use:
 *   - PUBLIC_CACHE: 60s edge, 5min stale-while-revalidate
 *     fits listings that change a few times a day.
 *   - PRIVATE_NO_STORE: emit explicitly on auth-bearing routes
 *     so any reverse proxy cache definitely skips them.
 * ============================================================
 */

import { NextResponse } from 'next/server'

const PUBLIC_CACHE =
  's-maxage=60, stale-while-revalidate=300, public'

const PRIVATE_NO_STORE = 'private, no-store, max-age=0'

/**
 * Mark a response as cacheable at the edge. Don't use on routes
 * that vary by caller (those use withPrivateNoStore).
 */
export function withPublicCache<T extends NextResponse>(res: T): T {
  res.headers.set('Cache-Control', PUBLIC_CACHE)
  // Authoritative — different responses for different Accept-Encoding
  // (gzip vs br) and ignoring cookies is fine on public endpoints.
  res.headers.set('Vary', 'Accept-Encoding')
  return res
}

/**
 * Explicitly forbid caching. Apply to anything that returns
 * user-specific data: bookings, profile, admin dashboards.
 */
export function withPrivateNoStore<T extends NextResponse>(res: T): T {
  res.headers.set('Cache-Control', PRIVATE_NO_STORE)
  return res
}
