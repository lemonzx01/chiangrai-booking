import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkRateLimit,
  getClientIP,
  rateLimitMiddleware,
  RATE_LIMIT_CONFIG,
} from '@/middleware/rate-limit'

// ============================================================
// RATE_LIMIT_CONFIG
// ============================================================
describe('RATE_LIMIT_CONFIG', () => {
  it('should have checkout limit of 10 per minute', () => {
    expect(RATE_LIMIT_CONFIG['/api/checkout'].maxRequests).toBe(10)
    expect(RATE_LIMIT_CONFIG['/api/checkout'].windowMs).toBe(60000)
  })

  it('should have forgot-password limit of 3 per hour', () => {
    expect(RATE_LIMIT_CONFIG['/api/auth/forgot-password'].maxRequests).toBe(3)
    expect(RATE_LIMIT_CONFIG['/api/auth/forgot-password'].windowMs).toBe(3600000)
  })

  it('should have default limit of 100 per minute', () => {
    expect(RATE_LIMIT_CONFIG.default.maxRequests).toBe(100)
  })
})

// ============================================================
// checkRateLimit
// ============================================================
describe('checkRateLimit', () => {
  // Use unique IPs per test to avoid cross-test pollution
  let testIP: string

  beforeEach(() => {
    testIP = `test-${Date.now()}-${Math.random()}`
  })

  it('should allow first request', () => {
    const result = checkRateLimit(testIP, '/api/checkout')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9) // 10 - 1
  })

  it('should decrement remaining count', () => {
    checkRateLimit(testIP, '/api/checkout')
    const result = checkRateLimit(testIP, '/api/checkout')
    expect(result.remaining).toBe(8) // 10 - 2
  })

  it('should block after exceeding limit', () => {
    // Exhaust the limit (10 requests for /api/checkout)
    for (let i = 0; i < 10; i++) {
      checkRateLimit(testIP, '/api/checkout')
    }

    const result = checkRateLimit(testIP, '/api/checkout')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should use default config for unknown endpoints', () => {
    const result = checkRateLimit(testIP, '/api/unknown')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(99) // 100 - 1
  })

  it('should have resetTime in the future', () => {
    const result = checkRateLimit(testIP, '/api/checkout')
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })
})

// ============================================================
// getClientIP
// ============================================================
describe('getClientIP', () => {
  it('should extract IP from x-forwarded-for', () => {
    const request = new Request('http://localhost/api', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIP(request)).toBe('1.2.3.4')
  })

  it('should extract IP from x-real-ip', () => {
    const request = new Request('http://localhost/api', {
      headers: { 'x-real-ip': '10.0.0.1' },
    })
    expect(getClientIP(request)).toBe('10.0.0.1')
  })

  it('should return unknown when no IP headers', () => {
    const request = new Request('http://localhost/api')
    expect(getClientIP(request)).toBe('unknown')
  })

  it('should prefer x-forwarded-for over x-real-ip', () => {
    const request = new Request('http://localhost/api', {
      headers: {
        'x-forwarded-for': '1.2.3.4',
        'x-real-ip': '5.6.7.8',
      },
    })
    expect(getClientIP(request)).toBe('1.2.3.4')
  })
})

// ============================================================
// rateLimitMiddleware
// ============================================================
describe('rateLimitMiddleware', () => {
  it('should return null when allowed', () => {
    const request = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': `rl-${Date.now()}-${Math.random()}` },
    })
    const result = rateLimitMiddleware(request, '/api/test')
    expect(result).toBeNull()
  })

  it('should return 429 response when blocked', () => {
    const ip = `blocked-${Date.now()}-${Math.random()}`
    const request = new Request('http://localhost/api/checkout', {
      headers: { 'x-forwarded-for': ip },
    })

    // Exhaust the limit
    for (let i = 0; i < 11; i++) {
      rateLimitMiddleware(request, '/api/checkout')
    }

    const result = rateLimitMiddleware(request, '/api/checkout')
    expect(result).not.toBeNull()
    expect(result!.status).toBe(429)
  })

  it('should include rate limit headers in 429 response', async () => {
    const ip = `headers-${Date.now()}-${Math.random()}`
    const request = new Request('http://localhost/api/checkout', {
      headers: { 'x-forwarded-for': ip },
    })

    // Exhaust the limit
    for (let i = 0; i < 11; i++) {
      rateLimitMiddleware(request, '/api/checkout')
    }

    const result = rateLimitMiddleware(request, '/api/checkout')
    expect(result!.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(result!.headers.get('Retry-After')).toBeDefined()
  })
})
