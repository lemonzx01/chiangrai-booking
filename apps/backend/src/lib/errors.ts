/**
 * ============================================================
 * Error Handling Utilities - ฟังก์ชันช่วยจัดการ errors
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - จัดการ errors แบบ standardized
 *   - สร้าง user-friendly error messages
 *   - Log errors สำหรับ debugging
 *
 * ============================================================
 */

// ============================================================
// Error Types
// ============================================================

/**
 * Custom Error Class สำหรับ Payment Errors
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

/**
 * Custom Error Class สำหรับ Validation Errors
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============================================================
// Error Messages
// ============================================================

/**
 * Error messages ที่ user-friendly
 */
export const ERROR_MESSAGES = {
  // Payment Errors
  PAYMENT_CREATE_FAILED: 'ไม่สามารถสร้างการชำระเงินได้ กรุณาลองใหม่อีกครั้ง',
  PAYMENT_SESSION_EXPIRED: 'Session การชำระเงินหมดอายุแล้ว กรุณาสร้างใหม่',
  PAYMENT_INVALID_BOOKING: 'ไม่พบข้อมูลการจอง',
  PAYMENT_CURRENCY_CONVERSION_FAILED: 'ไม่สามารถแปลงสกุลเงินได้ กรุณาลองใหม่อีกครั้ง',
  PAYMENT_STRIPE_ERROR: 'เกิดข้อผิดพลาดจากระบบชำระเงิน กรุณาลองใหม่อีกครั้ง',

  // Validation Errors
  VALIDATION_INVALID_DATA: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  VALIDATION_MISSING_FIELD: 'กรุณากรอกข้อมูลให้ครบถ้วน',

  // Network Errors
  NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต',
  NETWORK_TIMEOUT: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง',

  // Database Errors
  DATABASE_ERROR: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง',

  // Generic
  UNKNOWN_ERROR: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง',
} as const

// ============================================================
// Error Handling Functions
// ============================================================

/**
 * จัดการ error และส่งกลับ user-friendly message
 *
 * @param error - Error object
 * @param defaultMessage - ข้อความ default ถ้าไม่รู้จัก error
 * @returns User-friendly error message
 *
 * @example
 * try {
 *   // operation
 * } catch (error) {
 *   const message = handleError(error, ERROR_MESSAGES.UNKNOWN_ERROR)
 *   return NextResponse.json({ error: message }, { status: 500 })
 * }
 */
export function handleError(
  error: unknown,
  defaultMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR
): string {
  // Log error สำหรับ debugging
  console.error('Error occurred:', error)

  // ถ้าเป็น PaymentError
  if (error instanceof PaymentError) {
    return error.message
  }

  // ถ้าเป็น ValidationError
  if (error instanceof ValidationError) {
    return error.message
  }

  // ถ้าเป็น Error object
  if (error instanceof Error) {
    // ตรวจสอบว่าเป็น Stripe error หรือไม่
    if (error.message.includes('Stripe') || error.message.includes('stripe')) {
      return ERROR_MESSAGES.PAYMENT_STRIPE_ERROR
    }

    // ตรวจสอบว่าเป็น network error หรือไม่
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }

    // ตรวจสอบว่าเป็น timeout หรือไม่
    if (error.message.includes('timeout')) {
      return ERROR_MESSAGES.NETWORK_TIMEOUT
    }

    // ใช้ error message จาก error object
    return error.message || defaultMessage
  }

  // ถ้าไม่ใช่ Error object ให้ใช้ default message
  return defaultMessage
}

/**
 * จัดการ Stripe errors โดยเฉพาะ
 *
 * @param error - Stripe error
 * @returns User-friendly error message
 */
export function handleStripeError(error: unknown): string {
  if (error instanceof Error) {
    // Stripe error types
    if (error.message.includes('card_declined')) {
      return 'บัตรเครดิตถูกปฏิเสธ กรุณาตรวจสอบข้อมูลบัตรหรือใช้บัตรอื่น'
    }
    if (error.message.includes('insufficient_funds')) {
      return 'ยอดเงินในบัตรไม่เพียงพอ'
    }
    if (error.message.includes('expired_card')) {
      return 'บัตรเครดิตหมดอายุแล้ว'
    }
    if (error.message.includes('invalid_cvc')) {
      return 'รหัส CVC ไม่ถูกต้อง'
    }
    if (error.message.includes('processing_error')) {
      return 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง'
    }
  }

  return ERROR_MESSAGES.PAYMENT_STRIPE_ERROR
}

/**
 * จัดการ database errors
 *
 * @param error - Database error
 * @returns User-friendly error message
 */
export function handleDatabaseError(error: unknown): string {
  if (error instanceof Error) {
    // PostgreSQL error codes
    if (error.message.includes('duplicate key')) {
      return 'ข้อมูลซ้ำกัน กรุณาตรวจสอบอีกครั้ง'
    }
    if (error.message.includes('foreign key')) {
      return 'ข้อมูลอ้างอิงไม่ถูกต้อง'
    }
    if (error.message.includes('not null')) {
      return 'กรุณากรอกข้อมูลให้ครบถ้วน'
    }
  }

  return ERROR_MESSAGES.DATABASE_ERROR
}

/**
 * สร้าง error response สำหรับ API
 *
 * @param error - Error object
 * @param statusCode - HTTP status code (default: 500)
 * @returns NextResponse with error
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500
) {
  const message = handleError(error)
  return {
    error: message,
    statusCode,
  }
}
