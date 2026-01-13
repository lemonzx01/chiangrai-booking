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

import NextAuth from 'next-auth'
import { authOptions } from '../../../../lib/auth/nextauth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
