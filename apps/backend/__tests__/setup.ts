import { vi } from 'vitest'

// Set required environment variables
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long!'
process.env.NEXT_PUBLIC_SUPABASE_URL = ''
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-32-chars-long!'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}))

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      }),
    redirect: (url: string) => new Response(null, { status: 302, headers: { Location: url } }),
  },
}))
