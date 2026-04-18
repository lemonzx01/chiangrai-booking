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

import { NextResponse } from 'next/server'
import { logger } from './logger'

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
  logger.error('Error occurred', { error })

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

// ============================================================
// Standardized API Response Helpers (Phase 3.2)
// ============================================================

/**
 * โครงสร้างมาตรฐานของ error response
 *
 * รูปแบบ: { error: { message, code?, requestId?, details? } }
 *
 * - message: ข้อความที่ user-facing (อ่านได้)
 * - code: machine-readable error code (เช่น 'INVALID_INPUT', 'NOT_FOUND')
 * - requestId: x-request-id ของ request นี้ (สำหรับการ trace logs)
 * - details: ข้อมูลเสริม (เช่น zod field errors)
 */
export interface ApiErrorBody {
  error: {
    message: string
    code?: string
    requestId?: string
    details?: unknown
  }
}

/**
 * สร้าง standardized error response
 *
 * @example
 * if (!body.email) {
 *   return apiError('Email required', 400, 'INVALID_INPUT')
 * }
 *
 * @example
 * try { ... } catch (e) {
 *   return apiError(e, 500)  // unknown error → handled via handleError()
 * }
 */
export function apiError(
  messageOrError: string | unknown,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorBody> {
  const message =
    typeof messageOrError === 'string'
      ? messageOrError
      : handleError(messageOrError)

  const body: ApiErrorBody = {
    error: {
      message,
      ...(code ? { code } : {}),
      ...(details !== undefined ? { details } : {}),
    },
  }

  return NextResponse.json(body, { status })
}

/**
 * สร้าง standardized success response
 *
 * @example
 * return apiSuccess({ booking })
 *
 * @example
 * return apiSuccess({ id: created.id }, 201)
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

/**
 * Convenience: 400 Bad Request with INVALID_INPUT code.
 */
export function apiBadRequest(message: string, details?: unknown) {
  return apiError(message, 400, 'INVALID_INPUT', details)
}

/**
 * Convenience: 401 Unauthorized.
 */
export function apiUnauthorized(message: string = 'Unauthorized') {
  return apiError(message, 401, 'UNAUTHORIZED')
}

/**
 * Convenience: 403 Forbidden.
 */
export function apiForbidden(message: string = 'Forbidden') {
  return apiError(message, 403, 'FORBIDDEN')
}

/**
 * Convenience: 404 Not Found.
 */
export function apiNotFound(message: string = 'Not found') {
  return apiError(message, 404, 'NOT_FOUND')
}

/**
 * Convenience: 409 Conflict.
 */
export function apiConflict(message: string, details?: unknown) {
  return apiError(message, 409, 'CONFLICT', details)
}

/**
 * Convenience: 429 Too Many Requests.
 */
export function apiTooManyRequests(
  message: string = 'Too many requests',
  retryAfterSeconds?: number
) {
  const res = apiError(message, 429, 'RATE_LIMITED')
  if (retryAfterSeconds) {
    res.headers.set('Retry-After', String(retryAfterSeconds))
  }
  return res
}

/**
 * Convenience: 500 Internal Server Error.
 * Logs the underlying error for debugging.
 */
export function apiServerError(error: unknown, message?: string) {
  logger.error('API server error', { error })
  return apiError(message || ERROR_MESSAGES.UNKNOWN_ERROR, 500, 'SERVER_ERROR')
}
