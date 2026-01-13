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
import type { NextRequest } from 'next/server'

// NextAuth v5 beta with Next.js 15 App Router
// NextAuth returns an object with GET and POST methods
const { handlers } = NextAuth(authOptions as any)

export const GET = handlers.GET
export const POST = handlers.POST
