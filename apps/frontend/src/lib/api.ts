/**
 * ============================================================
 * API Utilities
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - Helper functions สำหรับเรียก API
 *   - จัดการ Backend URL สำหรับ Server-side fetch
 *
 * ============================================================
 */

/**
 * ดึง Backend URL สำหรับเรียก API
 *
 * @description
 *   ใช้สำหรับ Server Components ที่ต้องเรียก API
 *   - Production: ใช้ BACKEND_URL
 *   - Development: ใช้ NEXT_PUBLIC_APP_URL หรือ localhost
 *
 * @returns {string} Backend URL
 */
export function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3001'
  )
}
