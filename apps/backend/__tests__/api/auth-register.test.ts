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

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
})
