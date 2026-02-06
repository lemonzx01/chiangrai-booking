import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before any imports
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      })),
    })),
  })),
}))

// Mock cookies
const mockCookieSet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: mockCookieSet,
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

import { POST } from '@/app/api/auth/login/route'

beforeEach(() => {
  vi.clearAllMocks()
})

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/login', () => {
  it('should return 400 when email is missing', async () => {
    const response = await POST(makeRequest({ password: 'test123' }))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  it('should return 400 when password is missing', async () => {
    const response = await POST(makeRequest({ email: 'test@example.com' }))
    expect(response.status).toBe(400)
  })

  it('should return 400 when both are missing', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  // Mock mode tests (SUPABASE_URL is empty in test setup)
  it('should login admin with correct credentials in mock mode', async () => {
    const response = await POST(
      makeRequest({ email: 'admin@gotjourneythailand.com', password: 'admin123' })
    )
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.user.role).toBe('admin')
  })

  it('should reject admin with wrong password in mock mode', async () => {
    const response = await POST(
      makeRequest({ email: 'admin@gotjourneythailand.com', password: 'wrong' })
    )
    expect(response.status).toBe(401)
  })

  it('should login default user in mock mode', async () => {
    const response = await POST(
      makeRequest({ email: 'user@example.com', password: 'user123' })
    )
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.user.role).toBe('user')
  })

  it('should return 401 for unknown email in mock mode', async () => {
    const response = await POST(
      makeRequest({ email: 'nobody@example.com', password: 'test123' })
    )
    expect(response.status).toBe(401)
  })

  it('should set cookie on successful login', async () => {
    await POST(
      makeRequest({ email: 'admin@gotjourneythailand.com', password: 'admin123' })
    )
    expect(mockCookieSet).toHaveBeenCalled()
    const [cookieName] = mockCookieSet.mock.calls[0]
    expect(cookieName).toBe('admin_token')
  })
})
