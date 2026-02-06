import { describe, it, expect, vi, beforeEach } from 'vitest'
import { jwtVerify } from 'jose'

// We need to control cookies mock per test
const mockGet = vi.fn()
const mockCookies = vi.fn(() => ({
  get: mockGet,
  set: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      }),
  },
}))

import {
  getJwtSecret,
  createToken,
  verifyAdminToken,
  verifyUserToken,
  isMockMode,
  getUserRole,
} from '@/lib/auth'

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================
// getJwtSecret
// ============================================================
describe('getJwtSecret', () => {
  it('should return Uint8Array when JWT_SECRET is set', () => {
    const secret = getJwtSecret()
    expect(secret).toBeInstanceOf(Uint8Array)
  })

  it('should throw when JWT_SECRET is missing', () => {
    const original = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    expect(() => getJwtSecret()).toThrow('JWT_SECRET environment variable is required')
    process.env.JWT_SECRET = original
  })
})

// ============================================================
// createToken
// ============================================================
describe('createToken', () => {
  it('should create a valid JWT token', async () => {
    const token = await createToken({
      sub: 'user-123',
      email: 'test@example.com',
      role: 'admin',
    })

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('should create a token verifiable with jose', async () => {
    const token = await createToken({
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
    })

    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)

    expect(payload.sub).toBe('user-123')
    expect(payload.email).toBe('test@example.com')
    expect(payload.role).toBe('admin')
  })

  it('should set expiration time', async () => {
    const token = await createToken({ sub: 'user-123' }, '1h')
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)

    expect(payload.exp).toBeDefined()
    expect(payload.iat).toBeDefined()
  })
})

// ============================================================
// verifyAdminToken
// ============================================================
describe('verifyAdminToken', () => {
  it('should return success false when no token', async () => {
    mockGet.mockReturnValue(undefined)
    const result = await verifyAdminToken()
    expect(result.success).toBe(false)
    expect(result.error).toBe('No token provided')
  })

  it('should return success true for valid admin token', async () => {
    const token = await createToken({
      sub: 'admin-1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
    })
    mockGet.mockReturnValue({ value: token })

    const result = await verifyAdminToken()
    expect(result.success).toBe(true)
    expect(result.user?.email).toBe('admin@test.com')
    expect(result.user?.role).toBe('admin')
  })

  it('should return success false for non-admin token', async () => {
    const token = await createToken({
      sub: 'user-1',
      email: 'user@test.com',
      name: 'User',
      role: 'user',
    })
    mockGet.mockReturnValue({ value: token })

    const result = await verifyAdminToken()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Not an admin')
  })

  it('should return success false for invalid token', async () => {
    mockGet.mockReturnValue({ value: 'invalid-token' })

    const result = await verifyAdminToken()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid token')
  })
})

// ============================================================
// verifyUserToken
// ============================================================
describe('verifyUserToken', () => {
  it('should return success false when no token', async () => {
    mockGet.mockReturnValue(undefined)
    const result = await verifyUserToken()
    expect(result.success).toBe(false)
  })

  it('should return success true for valid user token', async () => {
    const token = await createToken({
      sub: 'user-1',
      email: 'user@test.com',
      name: 'User',
    })
    mockGet.mockReturnValue({ value: token })

    const result = await verifyUserToken()
    expect(result.success).toBe(true)
    expect(result.user?.email).toBe('user@test.com')
  })

  it('should return success false for invalid token', async () => {
    mockGet.mockReturnValue({ value: 'bad-token' })
    const result = await verifyUserToken()
    expect(result.success).toBe(false)
  })
})

// ============================================================
// isMockMode
// ============================================================
describe('isMockMode', () => {
  it('should return true when SUPABASE_URL is empty', () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    expect(isMockMode()).toBe(true)
    process.env.NEXT_PUBLIC_SUPABASE_URL = original
  })

  it('should return true when SUPABASE_URL is placeholder', () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
    expect(isMockMode()).toBe(true)
    process.env.NEXT_PUBLIC_SUPABASE_URL = original
  })

  it('should return false when SUPABASE_URL is set to real value', () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co'
    expect(isMockMode()).toBe(false)
    process.env.NEXT_PUBLIC_SUPABASE_URL = original
  })
})

// ============================================================
// getUserRole
// ============================================================
describe('getUserRole', () => {
  it('should return null when no token', async () => {
    mockGet.mockReturnValue(undefined)
    const role = await getUserRole()
    expect(role).toBeNull()
  })

  it('should return admin for admin token', async () => {
    const token = await createToken({ sub: 'admin-1', role: 'admin' })
    mockGet.mockImplementation((name: string) => {
      if (name === 'admin_token') return { value: token }
      return undefined
    })

    const role = await getUserRole()
    expect(role).toBe('admin')
  })

  it('should return null for invalid token', async () => {
    mockGet.mockImplementation((name: string) => {
      if (name === 'admin_token') return { value: 'bad' }
      return undefined
    })

    const role = await getUserRole()
    expect(role).toBeNull()
  })
})
