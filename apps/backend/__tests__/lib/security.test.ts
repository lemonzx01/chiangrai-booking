import { describe, it, expect } from 'vitest'
import {
  isValidUUID,
  isValidEmail,
  isValidPhone,
  isValidCurrency,
  sanitizeString,
  sanitizeObject,
  hasSQLInjection,
  validateInput,
  SECURITY_HEADERS,
  addSecurityHeaders,
} from '@/lib/security'

// ============================================================
// isValidUUID
// ============================================================
describe('isValidUUID', () => {
  it('should return true for valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('should return true for valid UUID v1', () => {
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
  })

  it('should return false for invalid UUID', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidUUID('')).toBe(false)
  })

  it('should return false for UUID without dashes', () => {
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false)
  })
})

// ============================================================
// isValidEmail
// ============================================================
describe('isValidEmail', () => {
  it('should return true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
  })

  it('should return true for email with subdomain', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true)
  })

  it('should return false for email without @', () => {
    expect(isValidEmail('invalid-email')).toBe(false)
  })

  it('should return false for email without domain', () => {
    expect(isValidEmail('user@')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })
})

// ============================================================
// isValidPhone
// ============================================================
describe('isValidPhone', () => {
  it('should return true for Thai mobile number', () => {
    expect(isValidPhone('0812345678')).toBe(true)
  })

  it('should return true for number with dashes', () => {
    expect(isValidPhone('081-234-5678')).toBe(true)
  })

  it('should return true for number with country code', () => {
    expect(isValidPhone('+66812345678')).toBe(true)
  })

  it('should return false for too short number', () => {
    expect(isValidPhone('123')).toBe(false)
  })

  it('should return false for letters', () => {
    expect(isValidPhone('abcdefghij')).toBe(false)
  })
})

// ============================================================
// isValidCurrency
// ============================================================
describe('isValidCurrency', () => {
  it.each(['THB', 'USD', 'EUR', 'JPY', 'CNY', 'GBP'])('should return true for %s', (currency) => {
    expect(isValidCurrency(currency)).toBe(true)
  })

  it('should return true for lowercase input', () => {
    expect(isValidCurrency('thb')).toBe(true)
  })

  it('should return false for invalid currency', () => {
    expect(isValidCurrency('XYZ')).toBe(false)
  })
})

// ============================================================
// sanitizeString
// ============================================================
describe('sanitizeString', () => {
  it('should escape < and >', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('should escape &', () => {
    expect(sanitizeString('foo & bar')).toBe('foo &amp; bar')
  })

  it('should escape double quotes', () => {
    expect(sanitizeString('say "hello"')).toBe('say &quot;hello&quot;')
  })

  it('should escape single quotes', () => {
    expect(sanitizeString("it's")).toBe('it&#x27;s')
  })

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })

  it('should handle empty string', () => {
    expect(sanitizeString('')).toBe('')
  })
})

// ============================================================
// sanitizeObject
// ============================================================
describe('sanitizeObject', () => {
  it('should sanitize string values in object', () => {
    const result = sanitizeObject({ name: '<b>bold</b>', age: 25 })
    expect(result.name).toBe('&lt;b&gt;bold&lt;/b&gt;')
    expect(result.age).toBe(25)
  })

  it('should sanitize nested objects', () => {
    const result = sanitizeObject({
      user: { name: '<script>x</script>' },
    })
    expect(result.user.name).toBe('&lt;script&gt;x&lt;/script&gt;')
  })

  it('should leave non-string/non-object values unchanged', () => {
    const result = sanitizeObject({ count: 42, active: true })
    expect(result.count).toBe(42)
    expect(result.active).toBe(true)
  })
})

// ============================================================
// hasSQLInjection
// ============================================================
describe('hasSQLInjection', () => {
  it('should detect SELECT statement', () => {
    expect(hasSQLInjection('SELECT * FROM users')).toBe(true)
  })

  it('should detect DROP TABLE', () => {
    expect(hasSQLInjection('DROP TABLE users')).toBe(true)
  })

  it('should detect SQL comment --', () => {
    expect(hasSQLInjection("admin'--")).toBe(true)
  })

  it('should detect OR 1=1 tautology', () => {
    expect(hasSQLInjection("' OR 1=1")).toBe(true)
  })

  it('should return false for normal input', () => {
    expect(hasSQLInjection('John Doe')).toBe(false)
  })

  it('should return false for email', () => {
    expect(hasSQLInjection('user@example.com')).toBe(false)
  })
})

// ============================================================
// validateInput
// ============================================================
describe('validateInput', () => {
  it('should return true for safe string', () => {
    expect(validateInput('hello world')).toBe(true)
  })

  it('should return false for SQL injection', () => {
    expect(validateInput("'; DROP TABLE users;--")).toBe(false)
  })
})

// ============================================================
// SECURITY_HEADERS & addSecurityHeaders
// ============================================================
describe('SECURITY_HEADERS', () => {
  it('should contain required security headers', () => {
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff')
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY')
    expect(SECURITY_HEADERS['X-XSS-Protection']).toBe('1; mode=block')
  })
})

describe('addSecurityHeaders', () => {
  it('should add security headers to response', () => {
    const response = new Response('ok')
    addSecurityHeaders(response)
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
  })
})
