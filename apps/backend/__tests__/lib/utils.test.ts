import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  calculateNights,
  calculateTotalPrice,
  generateBookingCode,
  isValidEmail,
  isValidThaiPhone,
  isValidUUID,
  validatePassword,
  slugify,
  truncate,
  getInitials,
  safeJsonParse,
  sanitizeInput,
} from '@/lib/utils'

// ============================================================
// calculateNights
// ============================================================
describe('calculateNights', () => {
  it('should calculate 3 nights correctly', () => {
    expect(calculateNights('2024-01-15', '2024-01-18')).toBe(3)
  })

  it('should calculate 1 night', () => {
    expect(calculateNights('2024-01-15', '2024-01-16')).toBe(1)
  })

  it('should work with Date objects', () => {
    const checkIn = new Date('2024-01-15')
    const checkOut = new Date('2024-01-20')
    expect(calculateNights(checkIn, checkOut)).toBe(5)
  })

  it('should calculate 2 nights (from test-booking-logic.js)', () => {
    expect(calculateNights('2024-03-15', '2024-03-17')).toBe(2)
  })

  it('should handle same day (0 nights)', () => {
    expect(calculateNights('2024-01-15', '2024-01-15')).toBe(0)
  })
})

// ============================================================
// calculateTotalPrice
// ============================================================
describe('calculateTotalPrice', () => {
  it('should calculate 2500 x 3 = 7500 (hotel booking)', () => {
    expect(calculateTotalPrice(2500, 3)).toBe(7500)
  })

  it('should calculate 2000 x 2 = 4000 (hotel without room type)', () => {
    expect(calculateTotalPrice(2000, 2)).toBe(4000)
  })

  it('should calculate 1500 x 5 = 7500 (car booking)', () => {
    expect(calculateTotalPrice(1500, 5)).toBe(7500)
  })

  it('should return 0 for zero units', () => {
    expect(calculateTotalPrice(1000, 0)).toBe(0)
  })

  it('should handle decimal prices', () => {
    expect(calculateTotalPrice(99.99, 2)).toBeCloseTo(199.98)
  })
})

// ============================================================
// generateBookingCode
// ============================================================
describe('generateBookingCode', () => {
  it('should start with TE', () => {
    const code = generateBookingCode()
    expect(code).toMatch(/^TE/)
  })

  it('should match format TEYYMMDD-XXXX', () => {
    const code = generateBookingCode()
    expect(code).toMatch(/^TE\d{6}-[A-Z0-9]{4}$/)
  })

  it('should generate unique codes', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateBookingCode()))
    expect(codes.size).toBe(10)
  })
})

// ============================================================
// isValidEmail
// ============================================================
describe('isValidEmail', () => {
  it('should return true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
  })

  it('should return false for invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })
})

// ============================================================
// isValidThaiPhone
// ============================================================
describe('isValidThaiPhone', () => {
  it('should return true for mobile 08x', () => {
    expect(isValidThaiPhone('0812345678')).toBe(true)
  })

  it('should return true for mobile 06x', () => {
    expect(isValidThaiPhone('0612345678')).toBe(true)
  })

  it('should return true for mobile 09x', () => {
    expect(isValidThaiPhone('0912345678')).toBe(true)
  })

  it('should return true for landline 02x', () => {
    expect(isValidThaiPhone('021234567')).toBe(true)
  })

  it('should return true for number with dashes', () => {
    expect(isValidThaiPhone('081-234-5678')).toBe(true)
  })

  it('should return false for non-Thai number', () => {
    expect(isValidThaiPhone('1234567890')).toBe(false)
  })

  it('should return false for too short', () => {
    expect(isValidThaiPhone('081')).toBe(false)
  })
})

// ============================================================
// isValidUUID
// ============================================================
describe('isValidUUID', () => {
  it('should return true for valid UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('should return false for invalid UUID', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
  })
})

// ============================================================
// validatePassword
// ============================================================
describe('validatePassword', () => {
  it('should return strong for password with all criteria', () => {
    const result = validatePassword('Abc123!@#', 'en')
    expect(result.isValid).toBe(true)
    expect(result.strength).toBe('strong')
    expect(result.errors).toHaveLength(0)
  })

  it('should return medium for password without special chars', () => {
    const result = validatePassword('Abcdef12', 'en')
    expect(result.isValid).toBe(true)
    expect(result.strength).toBe('medium')
  })

  it('should fail for too short password', () => {
    const result = validatePassword('Ab1!', 'en')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password must be at least 8 characters')
  })

  it('should fail for no uppercase', () => {
    const result = validatePassword('abcdef12', 'en')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Must contain at least 1 uppercase letter')
  })

  it('should fail for no lowercase', () => {
    const result = validatePassword('ABCDEF12', 'en')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Must contain at least 1 lowercase letter')
  })

  it('should fail for no number', () => {
    const result = validatePassword('Abcdefgh', 'en')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Must contain at least 1 number')
  })

  it('should return Thai messages when lang is th', () => {
    const result = validatePassword('abc', 'th')
    expect(result.errors.some(e => e.includes('ตัวอักษร'))).toBe(true)
  })

  it('should return weak for password failing multiple criteria', () => {
    const result = validatePassword('abc', 'en')
    expect(result.strength).toBe('weak')
  })
})

// ============================================================
// slugify
// ============================================================
describe('slugify', () => {
  it('should convert to lowercase with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('should remove special characters', () => {
    expect(slugify('Hello World!')).toBe('hello-world')
  })

  it('should handle multiple spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('should trim dashes', () => {
    expect(slugify('-hello-world-')).toBe('hello-world')
  })
})

// ============================================================
// truncate
// ============================================================
describe('truncate', () => {
  it('should truncate long text', () => {
    expect(truncate('This is a long text', 10)).toBe('This is a ...')
  })

  it('should not truncate short text', () => {
    expect(truncate('Short', 10)).toBe('Short')
  })

  it('should handle exact length', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })
})

// ============================================================
// getInitials
// ============================================================
describe('getInitials', () => {
  it('should return initials for two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('should return max 2 characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('should return uppercase for single name', () => {
    const result = getInitials('Alice')
    expect(result).toBe('A')
  })
})

// ============================================================
// safeJsonParse
// ============================================================
describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 })
  })

  it('should return fallback for invalid JSON', () => {
    expect(safeJsonParse('invalid', { default: true })).toEqual({ default: true })
  })

  it('should parse array JSON', () => {
    expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3])
  })
})

// ============================================================
// sanitizeInput
// ============================================================
describe('sanitizeInput', () => {
  it('should escape XSS payload', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('should escape & character', () => {
    expect(sanitizeInput('a & b')).toBe('a &amp; b')
  })

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })
})

// ============================================================
// formatCurrency
// ============================================================
describe('formatCurrency', () => {
  it('should format Thai Baht', () => {
    const result = formatCurrency(1234)
    expect(result).toContain('1,234')
  })

  it('should format zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

// ============================================================
// formatDate
// ============================================================
describe('formatDate', () => {
  it('should format string date', () => {
    const result = formatDate('2024-01-15', 'en-US')
    expect(result).toContain('January')
    expect(result).toContain('15')
  })

  it('should format Date object', () => {
    const result = formatDate(new Date('2024-06-01'), 'en-US')
    expect(result).toContain('June')
  })
})

// ============================================================
// formatDateRange
// ============================================================
describe('formatDateRange', () => {
  it('should format date range with separator', () => {
    const result = formatDateRange('2024-01-15', '2024-01-20', 'en-US')
    expect(result).toContain(' - ')
    expect(result).toContain('15')
    expect(result).toContain('20')
  })
})
