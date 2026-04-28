/**
 * ============================================================
 * Tests for GET /api/health
 * ============================================================
 *
 * Health checks need to be:
 *   1. Always 200 unless something is genuinely unrecoverable
 *      (uptime monitors should parse the body, not the status)
 *   2. Cheap (NO secrets, NO sensitive timing fingerprints
 *      in the public response)
 *   3. Honest — degraded == degraded, no white-lying to keep
 *      a green dashboard
 *
 * In mock mode (which CI runs in), the response should still
 * report a valid status — that's how dev environments stay
 * green without a real DB.
 * ============================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
  vi.unstubAllEnvs()
})

describe('GET /api/health (mock mode)', () => {
  it('returns 200 with status=ok in dev mock mode', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { GET } = await import('@/app/api/health/route')
    const res = await GET(new Request('http://localhost/api/health'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.services).toBeDefined()
  })

  it('reports services per slot', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { GET } = await import('@/app/api/health/route')
    const res = await GET(new Request('http://localhost/api/health'))
    const body = await res.json()
    expect(body.services).toHaveProperty('database')
    expect(body.services).toHaveProperty('stripe')
    expect(body.services).toHaveProperty('email')
    expect(body.services).toHaveProperty('auth')
  })

  it('database status reads "mock" in mock mode', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { GET } = await import('@/app/api/health/route')
    const res = await GET(new Request('http://localhost/api/health'))
    const body = await res.json()
    expect(body.services.database).toBe('mock')
  })

  it('does NOT include sensitive fields in the public response', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { GET } = await import('@/app/api/health/route')
    const res = await GET(new Request('http://localhost/api/health'))
    const body = await res.json()
    expect(body.deploy).toBeUndefined()
    expect(body.envAudit).toBeUndefined()
    expect(body.probes).toBeUndefined()
    expect(body.mockMode).toBeUndefined()
  })
})

describe('GET /api/health?secret=... (detailed)', () => {
  it('exposes deploy + env audit when the right secret is supplied', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HEALTH_CHECK_SECRET', 'test-secret')
    const { GET } = await import('@/app/api/health/route')
    const res = await GET(
      new Request('http://localhost/api/health?secret=test-secret')
    )
    const body = await res.json()
    expect(body.deploy).toBeDefined()
    expect(body.envAudit).toBeDefined()
    expect(body.envAudit.audit).toBeDefined()
    expect(body.uptime).toBeDefined()
    expect(body.probes).toBeDefined()
  })

  it('rejects wrong secret silently (treat like a public request)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HEALTH_CHECK_SECRET', 'test-secret')
    const { GET } = await import('@/app/api/health/route')
    const res = await GET(
      new Request('http://localhost/api/health?secret=wrong-secret')
    )
    const body = await res.json()
    expect(body.deploy).toBeUndefined()
    expect(body.envAudit).toBeUndefined()
  })

  it('ignores ?secret when HEALTH_CHECK_SECRET env is unset (dev safety)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    // HEALTH_CHECK_SECRET is unset — without an opt-in, query
    // strings can't unlock the detailed view (prevents accidental
    // exposure on misconfigured deploys).
    const { GET } = await import('@/app/api/health/route')
    const res = await GET(
      new Request('http://localhost/api/health?secret=anything')
    )
    const body = await res.json()
    expect(body.deploy).toBeUndefined()
  })

  it('env audit reports presence as boolean, never the value', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HEALTH_CHECK_SECRET', 'test-secret')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_pretend_this_is_real')
    const { GET } = await import('@/app/api/health/route')
    const res = await GET(
      new Request('http://localhost/api/health?secret=test-secret')
    )
    const body = await res.json()
    expect(body.envAudit.audit.STRIPE_SECRET_KEY).toBe(true)
    // The actual value MUST NOT appear anywhere in the response.
    const json = JSON.stringify(body)
    expect(json).not.toContain('sk_live_pretend_this_is_real')
  })
})

describe('GET /api/health (production safety)', () => {
  it('returns 500 when JWT_SECRET is missing in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('JWT_SECRET', '')
    const { GET } = await import('@/app/api/health/route')
    const res = await GET(new Request('http://localhost/api/health'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.status).toBe('error')
  })
})
