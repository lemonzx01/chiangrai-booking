import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'new-1', email: 'new@example.com', name: 'New User' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}))

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      }),
  },
}))

import { POST } from '@/app/api/auth/register/route'

beforeEach(() => {
  vi.clearAllMocks()
})

// We're now rate-limited at 5/hour/IP. The in-memory store is
// per process, so without a unique IP per call the 6th request
// in a single test run would hit a 429. Each test gets its own
// IP via x-forwarded-for to stay isolated.
let ipCounter = 0
function makeRequest(body: Record<string, unknown>, ip?: string) {
  return new Request('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip || `10.0.0.${++ipCounter}`,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  it('should return 400 when fields are missing', async () => {
    const response = await POST(makeRequest({ email: 'test@example.com' }))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  it('should return 400 for weak password', async () => {
    const response = await POST(
      makeRequest({
        email: 'new@example.com',
        password: '123',
        name: 'Test User',
      })
    )
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('รหัสผ่าน')
  })

  it('should return 400 for invalid email format', async () => {
    const response = await POST(
      makeRequest({
        email: 'not-an-email',
        password: 'StrongPass1!',
        name: 'Test User',
      })
    )
    expect(response.status).toBe(400)
  })

  it('should return 409 for duplicate email in mock mode', async () => {
    const response = await POST(
      makeRequest({
        email: 'user@example.com',
        password: 'StrongPass1!',
        name: 'Existing User',
      })
    )
    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data.error).toContain('ถูกใช้งานแล้ว')
  })

  it('should return 201 for valid new user registration in mock mode', async () => {
    const uniqueEmail = `newuser-${Date.now()}@example.com`
    const response = await POST(
      makeRequest({
        email: uniqueEmail,
        password: 'StrongPass1!',
        name: 'New User',
      })
    )
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.message).toContain('สำเร็จ')
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe(uniqueEmail)
  })

  it('should return 400 for missing name', async () => {
    const response = await POST(
      makeRequest({
        email: 'new@example.com',
        password: 'StrongPass1!',
      })
    )
    expect(response.status).toBe(400)
  })

  it('should accept optional phone', async () => {
    const uniqueEmail = `phone-user-${Date.now()}@example.com`
    const response = await POST(
      makeRequest({
        email: uniqueEmail,
        password: 'StrongPass1!',
        name: 'Phone User',
        phone: '0812345678',
      })
    )
    expect(response.status).toBe(201)
  })

  it('rate-limits a single IP after 5 successful registrations in an hour', async () => {
    // Pin all 6 calls to the same IP to exercise the rate limiter.
    // Each call uses a unique email so duplicate-email rejection
    // doesn't shadow the rate-limit response.
    const PINNED_IP = '203.0.113.42'

    for (let i = 0; i < 5; i++) {
      const res = await POST(
        makeRequest(
          {
            email: `flood-${i}-${Date.now()}@example.com`,
            password: 'StrongPass1!',
            name: `Flood ${i}`,
          },
          PINNED_IP
        )
      )
      expect(res.status).toBe(201)
    }

    // 6th attempt from the same IP within the window → 429.
    const blocked = await POST(
      makeRequest(
        {
          email: `flood-6-${Date.now()}@example.com`,
          password: 'StrongPass1!',
          name: 'Flood 6',
        },
        PINNED_IP
      )
    )
    expect(blocked.status).toBe(429)
  })
})

// ---------------------------------------------------------------
// Per-referrer notification throttle
// ---------------------------------------------------------------
//
// Independent unit covering the in-memory throttle that prevents
// a single referrer from being inbox-bombed by signup spam. The
// implementation is exported as `_shouldNotifyReferrerForTest`
// from the route module specifically so this test can poke at it
// without spinning up the full POST handler.

import { _shouldNotifyReferrerForTest } from '@/app/api/auth/register/route'

describe('shouldNotifyReferrer (per-referrer throttle)', () => {
  it('allows the first 5 calls and blocks the 6th within 24h', () => {
    const id = `ref-${Date.now()}`
    expect(_shouldNotifyReferrerForTest(id)).toBe(true)
    expect(_shouldNotifyReferrerForTest(id)).toBe(true)
    expect(_shouldNotifyReferrerForTest(id)).toBe(true)
    expect(_shouldNotifyReferrerForTest(id)).toBe(true)
    expect(_shouldNotifyReferrerForTest(id)).toBe(true)
    // 6th call → silent drop
    expect(_shouldNotifyReferrerForTest(id)).toBe(false)
    expect(_shouldNotifyReferrerForTest(id)).toBe(false)
  })

  it('counts each referrer independently', () => {
    const a = `ref-a-${Date.now()}`
    const b = `ref-b-${Date.now()}`

    // Burn through A's quota.
    for (let i = 0; i < 5; i++) _shouldNotifyReferrerForTest(a)
    expect(_shouldNotifyReferrerForTest(a)).toBe(false)

    // B is unaffected.
    expect(_shouldNotifyReferrerForTest(b)).toBe(true)
  })
})
