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

export const dynamic = 'force-dynamic'

import { handlers } from '../../../../lib/auth/nextauth'

if (!handlers) {
  throw new Error('NextAuth handlers not initialized')
}

if (!handlers.GET || !handlers.POST) {
  throw new Error(`NextAuth handlers incomplete: GET=${!!handlers.GET}, POST=${!!handlers.POST}`)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const isSigninGoogle = url.pathname.includes('/signin/google')

  // Handle Google OAuth signin when credentials are missing
  if (isSigninGoogle && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)) {
    console.error('Google OAuth signin attempted but credentials are missing')
    return new Response(
      JSON.stringify({
        error: 'Google OAuth is not configured',
        message: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    return await handlers.GET(request)
  } catch (error: any) {
    console.error('NextAuth GET handler error:', error?.message)
    return new Response(
      JSON.stringify({
        error: 'Authentication error',
        message: error?.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function POST(request: Request) {
  try {
    return await handlers.POST(request)
  } catch (error: any) {
    console.error('NextAuth POST handler error:', error?.message)
    return new Response(
      JSON.stringify({
        error: 'Authentication error',
        message: error?.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
