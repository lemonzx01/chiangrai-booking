/**
 * ============================================================
 * API Utilities
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - Helper functions สำหรับเรียก API
 *   - จัดการ Backend URL สำหรับ Server-side fetch
 *   - CSRF-aware client fetch wrapper
 *
 * Architecture (Vercel two-project deploy):
 *   browser  → frontend.vercel.app/api/*
 *           ↓ next.config.mjs rewrite
 *   frontend → backend.vercel.app/api/*    (BACKEND_URL)
 *
 * Server Components on the frontend talk DIRECTLY to the
 * backend (no rewrite happens server-side), so we need
 * getBackendUrl() to give us an absolute URL.
 *
 * Browser code uses /api/* relative paths and lets the
 * rewrite forward them.
 * ============================================================
 */

// ============================================================
// Backend URL (server-side)
// ============================================================

/**
 * ดึง Backend URL สำหรับเรียก API จาก Server Components
 *
 * Resolution order:
 *   1. BACKEND_URL                    (Vercel two-project setup)
 *   2. NEXT_PUBLIC_API_BASE           (custom override)
 *   3. NEXT_PUBLIC_APP_URL            (single-project setup)
 *   4. http://localhost:3001          (local dev)
 */
export function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3001'
  )
}

/**
 * Build a fully-qualified backend URL.
 *
 * @example
 *   const res = await fetch(backendUrl('/api/hotels'))
 */
export function backendUrl(path: string): string {
  const base = getBackendUrl().replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

// ============================================================
// CSRF helpers (browser-side)
// ============================================================

/**
 * อ่าน CSRF token จาก cookie ที่ backend issue ไว้
 * (ใช้ pattern double-submit cookie)
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

/**
 * Wrapper สำหรับ fetch() ในฝั่ง browser ที่:
 *   - เพิ่ม X-CSRF-Token header สำหรับ unsafe methods
 *   - เพิ่ม credentials: 'include' เพื่อ forward cookies
 *   - แปลง body เป็น JSON อัตโนมัติ (ถ้าเป็น object)
 *
 * @example
 *   const res = await apiFetch('/api/bookings', {
 *     method: 'POST',
 *     body: { hotel_id, check_in, check_out },
 *   })
 *   const data = await res.json()
 */
export async function apiFetch(
  input: string,
  init: Omit<RequestInit, 'body'> & { body?: unknown } = {}
): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase()
  const isSafe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'

  const headers = new Headers(init.headers || {})

  // Only JSON-ify plain objects. FormData, Blob, ArrayBuffer and
  // URLSearchParams are all `typeof 'object'` too, and stamping
  // application/json on them is actively harmful: a multipart upload
  // needs the browser to generate `multipart/form-data; boundary=…`
  // itself, and overriding that header strips the boundary so the
  // server cannot parse a single field.
  const isStructuredBody =
    typeof FormData !== 'undefined' && init.body instanceof FormData
      ? true
      : typeof Blob !== 'undefined' && init.body instanceof Blob
        ? true
        : typeof URLSearchParams !== 'undefined' &&
            init.body instanceof URLSearchParams
          ? true
          : init.body instanceof ArrayBuffer

  if (
    !headers.has('Content-Type') &&
    init.body &&
    typeof init.body === 'object' &&
    !isStructuredBody
  ) {
    headers.set('Content-Type', 'application/json')
  }
  if (!isSafe) {
    const token = getCsrfToken()
    if (token) headers.set('X-CSRF-Token', token)
  }

  // Auto-stringify object bodies
  let body: BodyInit | undefined = undefined
  if (init.body !== undefined && init.body !== null) {
    if (typeof init.body === 'string' || isStructuredBody) {
      body = init.body as BodyInit
    } else {
      body = JSON.stringify(init.body)
    }
  }

  return fetch(input, {
    ...init,
    method,
    headers,
    body,
    credentials: init.credentials || 'include',
  })
}

/**
 * Convenience: apiFetch + JSON parse + throw on !ok
 */
export async function apiJson<T = unknown>(
  input: string,
  init: Omit<RequestInit, 'body'> & { body?: unknown } = {}
): Promise<T> {
  const res = await apiFetch(input, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      (data as any)?.error?.message ||
      (data as any)?.error ||
      `Request failed with status ${res.status}`
    throw new Error(message)
  }
  return data as T
}
