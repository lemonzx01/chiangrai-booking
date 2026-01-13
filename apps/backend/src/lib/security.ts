/**
 * ============================================================
 * Security Utilities - ฟังก์ชันช่วยด้านความปลอดภัย
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - Input validation
 *   - Sanitization
 *   - Security headers
 *
 * ============================================================
 */

// ============================================================
// Input Validation
// ============================================================

/**
 * ตรวจสอบว่า string เป็น UUID หรือไม่
 *
 * @param value - ค่าที่ต้องการตรวจสอบ
 * @returns true ถ้าเป็น UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * ตรวจสอบว่า string เป็น email หรือไม่
 *
 * @param value - ค่าที่ต้องการตรวจสอบ
 * @returns true ถ้าเป็น email
 */
export function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

/**
 * ตรวจสอบว่า string เป็น phone number หรือไม่
 *
 * @param value - ค่าที่ต้องการตรวจสอบ
 * @returns true ถ้าเป็น phone number
 */
export function isValidPhone(value: string): boolean {
  // รองรับทั้งไทยและต่างประเทศ
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 8
}

/**
 * ตรวจสอบว่า string เป็น currency code หรือไม่
 *
 * @param value - ค่าที่ต้องการตรวจสอบ
 * @returns true ถ้าเป็น currency code
 */
export function isValidCurrency(value: string): boolean {
  const validCurrencies = ['THB', 'USD', 'EUR', 'JPY', 'CNY', 'GBP']
  return validCurrencies.includes(value.toUpperCase())
}

// ============================================================
// Sanitization
// ============================================================

/**
 * Sanitize string เพื่อป้องกัน XSS
 *
 * @param value - ค่าที่ต้องการ sanitize
 * @returns Sanitized string
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/[<>]/g, '') // ลบ < และ >
    .trim()
}

/**
 * Sanitize object เพื่อป้องกัน XSS
 *
 * @param obj - Object ที่ต้องการ sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as T[Extract<keyof T, string>]
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]) as T[Extract<keyof T, string>]
    }
  }
  return sanitized
}

// ============================================================
// Security Headers
// ============================================================

/**
 * Security headers สำหรับ API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const

/**
 * เพิ่ม security headers ให้ response
 *
 * @param response - Response object
 * @returns Response พร้อม security headers
 */
export function addSecurityHeaders(response: Response): Response {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

// ============================================================
// SQL Injection Prevention
// ============================================================

/**
 * ตรวจสอบว่า string มี SQL injection patterns หรือไม่
 *
 * @param value - ค่าที่ต้องการตรวจสอบ
 * @returns true ถ้าพบ SQL injection patterns
 */
export function hasSQLInjection(value: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|#|\/\*|\*\/)/, // SQL comments
    /(;|\||&)/, // Command separators
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i, // SQL injection patterns
  ]

  return sqlPatterns.some((pattern) => pattern.test(value))
}

/**
 * Validate และ sanitize input เพื่อป้องกัน SQL injection
 *
 * @param value - ค่าที่ต้องการ validate
 * @returns true ถ้าปลอดภัย
 */
export function validateInput(value: string): boolean {
  if (hasSQLInjection(value)) {
    return false
  }
  return true
}
