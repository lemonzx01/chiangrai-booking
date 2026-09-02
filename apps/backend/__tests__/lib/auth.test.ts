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
  isStripeMockMode,
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

  it('should fall back to mock secret when JWT_SECRET is missing in mock mode', () => {
    // Phase 1.1 added a mock-mode fallback so dev can boot without env vars.
    // The fallback only kicks in when Supabase is NOT configured.
    const originalJwt = process.env.JWT_SECRET
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.JWT_SECRET
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''

    const secret = getJwtSecret()
    expect(secret).toBeInstanceOf(Uint8Array)
    expect(secret.length).toBeGreaterThanOrEqual(32)

    process.env.JWT_SECRET = originalJwt
    if (originalUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  })

  it('should throw when JWT_SECRET is missing AND Supabase is configured', () => {
    const originalJwt = process.env.JWT_SECRET
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const originalSrv = process.env.SUPABASE_SERVICE_ROLE_KEY

    delete process.env.JWT_SECRET
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://real.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'real-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'real-service-key'

    expect(() => getJwtSecret()).toThrow('JWT_SECRET environment variable is required')

    process.env.JWT_SECRET = originalJwt
    if (originalUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL
    if (originalAnon !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnon
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (originalSrv !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = originalSrv
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY
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

  // ------------------------------------------------------------
  // Production fail-closed
  // ------------------------------------------------------------
  // Mock mode accepts hardcoded passwords ('admin123'), skips Stripe
  // signature verification and serves an in-memory DB. Inferring it
  // from a *missing* env var meant one forgotten variable on a
  // production deploy turned the site into an open admin panel, with
  // no error anywhere. These tests pin the refusal.
  describe('production fail-closed', () => {
    const withEnv = (
      env: Record<string, string | undefined>,
      run: () => void
    ) => {
      const saved: Record<string, string | undefined> = {}
      for (const k of Object.keys(env)) {
        saved[k] = process.env[k]
        if (env[k] === undefined) delete process.env[k]
        else process.env[k] = env[k] as string
      }
      try {
        run()
      } finally {
        for (const k of Object.keys(saved)) {
          if (saved[k] === undefined) delete process.env[k]
          else process.env[k] = saved[k] as string
        }
      }
    }

    it('refuses to infer mock mode in production', () => {
      withEnv(
        {
          NODE_ENV: 'production',
          NEXT_PUBLIC_SUPABASE_URL: '',
          ALLOW_MOCK_MODE: undefined,
        },
        () => expect(isMockMode()).toBe(false)
      )
    })

    it('allows mock mode in production only with the explicit opt-in', () => {
      withEnv(
        {
          NODE_ENV: 'production',
          NEXT_PUBLIC_SUPABASE_URL: '',
          ALLOW_MOCK_MODE: 'true',
        },
        () => expect(isMockMode()).toBe(true)
      )
    })

    it('still infers mock mode outside production', () => {
      withEnv(
        {
          NODE_ENV: 'development',
          NEXT_PUBLIC_SUPABASE_URL: '',
          ALLOW_MOCK_MODE: undefined,
        },
        () => expect(isMockMode()).toBe(true)
      )
    })

    it('refuses Stripe mock mode in production (webhooks would skip signature checks)', () => {
      withEnv(
        {
          NODE_ENV: 'production',
          STRIPE_SECRET_KEY: '',
          ALLOW_MOCK_MODE: undefined,
        },
        () => expect(isStripeMockMode()).toBe(false)
      )
    })

    it('allows Stripe mock mode in production with the explicit opt-in', () => {
      withEnv(
        {
          NODE_ENV: 'production',
          STRIPE_SECRET_KEY: '',
          ALLOW_MOCK_MODE: 'true',
        },
        () => expect(isStripeMockMode()).toBe(true)
      )
    })
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
