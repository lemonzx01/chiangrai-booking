/**
 * ============================================================
 * Admin Server-side Backend Fetch
 * ============================================================
 *
 * For Server Components in the (admin) route group that need to call
 * the backend with the caller's admin_token cookie.
 *
 * In the Vercel two-project setup, Next.js rewrites only affect
 * the browser. Server-side fetch() from the frontend project talks
 * directly to the backend and must forward the caller's cookies
 * manually.
 * ============================================================
 */

import { cookies } from 'next/headers'
import { backendUrl } from './api'

/**
 * Build a cookie-forwarding headers object.
 */
async function buildAdminHeaders(
  extra?: Record<string, string>
): Promise<HeadersInit> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra || {}),
  }
  if (cookieHeader) headers.Cookie = cookieHeader
  return headers
}

/**
 * Fetch a backend URL from a Server Component with admin cookies forwarded.
 * Always passes `cache: 'no-store'`.
 */
export async function adminBackendFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = await buildAdminHeaders(
    (init.headers as Record<string, string>) || undefined
  )
  return fetch(backendUrl(path), {
    ...init,
    cache: 'no-store',
    headers,
  })
}

/**
 * Convenience: fetch + JSON parse + throw on !ok.
 */
export async function adminBackendJson<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await adminBackendFetch(path, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      (data as any)?.error?.message ||
      (data as any)?.error ||
      `Backend request failed: ${res.status}`
    throw new Error(msg)
  }
  return data as T
}
