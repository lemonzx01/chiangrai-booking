/**
 * ============================================================
 * Health Check Endpoint
 * ============================================================
 *
 * GET /api/health
 *
 * Reports:
 *   - status: 'ok' | 'degraded'
 *   - mockMode: which external services are running in mock mode
 *   - version: git sha (set by Vercel) or 'dev'
 *   - timestamp
 *   - uptime: seconds since process start
 *
 * Used by:
 *   - Vercel health checks
 *   - Production checklist verification
 *   - Smoke tests
 * ============================================================
 */

import { NextResponse } from 'next/server'
import { getMockModeStatus } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const mockMode = getMockModeStatus()
  const anyMock = mockMode.supabase || mockMode.stripe || mockMode.email
  const isProd = process.env.NODE_ENV === 'production'

  // In production, having any service in mock mode is "degraded".
  const status = isProd && anyMock ? 'degraded' : 'ok'

  // JWT secret is required in production
  const jwtSet = !!process.env.JWT_SECRET
  if (isProd && !jwtSet) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'JWT_SECRET not set in production',
        mockMode,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      status,
      mockMode,
      version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || 'dev',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime ? process.uptime() : 0),
      checks: {
        jwt: jwtSet ? 'ok' : 'missing',
        supabase: mockMode.supabase ? 'mock' : 'configured',
        stripe: mockMode.stripe ? 'mock' : 'configured',
        email: mockMode.email ? 'mock' : 'configured',
      },
    },
    // status is narrowed to 'ok' | 'degraded' here — the 'error' branch already returned above.
    // Both 'ok' and 'degraded' return HTTP 200 so uptime monitors don't alarm during mock mode.
    { status: 200 }
  )
}
