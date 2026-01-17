/**
 * ============================================================
 * NextAuth API Route Handler
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - Export NextAuth handler สำหรับ Google OAuth และ Credentials
 *   - จัดการ authentication routes: /api/auth/signin, /api/auth/callback, etc.
 *
 * ============================================================
 */

import { handlers } from '../../../../lib/auth/nextauth'

// NextAuth v5 beta with Next.js 14/15 App Router
// Import handlers from lib/auth/nextauth.ts and export GET/POST
// This is the recommended pattern to avoid Next.js route export errors
// #region agent log
console.log('[DEBUG] Route module loaded')
console.log('[DEBUG] Handlers check:', {
  hasHandlers: !!handlers,
  hasGet: !!handlers?.GET,
  hasPost: !!handlers?.POST,
  handlersType: typeof handlers,
  handlersKeys: handlers ? Object.keys(handlers) : [],
})
// #endregion

// Validate handlers before export
if (!handlers) {
  const error = new Error('NextAuth handlers not initialized')
  console.error('[ERROR]', error.message)
  throw error
}

if (!handlers.GET || !handlers.POST) {
  const error = new Error(`NextAuth handlers incomplete: GET=${!!handlers.GET}, POST=${!!handlers.POST}`)
  console.error('[ERROR]', error.message)
  console.error('[ERROR] Handlers keys:', handlers ? Object.keys(handlers) : 'handlers is null/undefined')
  throw error
}

// Export GET and POST directly from handlers
// This is the correct pattern for Next.js 14/15
export const GET = handlers.GET
export const POST = handlers.POST
