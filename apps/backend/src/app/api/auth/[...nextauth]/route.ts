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

const handler = NextAuth(authOptions)

export async function GET(req: NextRequest) {
  return handler(req)
}

export async function POST(req: NextRequest) {
  return handler(req)
}
