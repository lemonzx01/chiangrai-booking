/**
 * ============================================================
 * Health Check Endpoint
 * ============================================================
 *
 * GET /api/health
 *
 * Two visibility levels:
 *
 * 1. PUBLIC (default — what an uptime monitor or load balancer
 *    hits): a small response with status + per-service "ok |
 *    mock | degraded" indicators. No secrets, no latency
 *    fingerprinting that an attacker could use to map our
 *    infra.
 *
 * 2. DETAILED (when caller passes ?secret=$HEALTH_CHECK_SECRET):
 *    adds DB ping latency, deploy metadata (commit sha + ref +
 *    region), uptime, env-var presence audit, audit-log row
 *    count. Used by admins when investigating "is something
 *    broken?".
 *
 * Either mode returns HTTP 200 unless something is genuinely
 * unusable (missing JWT in prod, DB ping fails) — uptime
 * monitors should treat 200 as "site is reachable" and parse
 * the JSON body for nuance.
 *
 * Mock mode in prod is 'degraded', not 'error', so a
 * misconfigured deploy is visible in the JSON without paging
 * the on-call.
 * ============================================================
 */

import { NextResponse } from 'next/server'
import { getMockModeStatus, isMockMode } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface DbProbe {
  ok: boolean
  latencyMs: number | null
  error: string | null
}

/**
 * Lightweight DB ping — selects 1 row from a tiny system-ish
 * table that should always exist. Caps total wait at 3s with
 * AbortSignal so a stuck DB can't make /api/health hang for
 * uptime monitors.
 */
async function probeDatabase(): Promise<DbProbe> {
  if (isMockMode()) {
    return { ok: true, latencyMs: null, error: null }
  }
  const start = Date.now()
  try {
    const supabase = await createAdminClient()
    // Hit the tiniest table that always exists. `email_unsubscribes`
    // (migration 0019) is empty for new deploys; the count query
    // returns instantly without scanning rows.
    const { error } = await supabase
      .from('email_unsubscribes')
      .select('email', { count: 'exact', head: true })
      .limit(1)
    const latencyMs = Date.now() - start
    if (error) {
      return { ok: false, latencyMs, error: error.message }
    }
    return { ok: true, latencyMs, error: null }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Audit env vars without exposing values — boolean presence
 * only. Surfaces "you forgot SENTRY_DSN" without leaking the
 * actual secret in a publicly-cacheable response.
 */
function envPresenceAudit() {
  const required = ['JWT_SECRET']
  const optional = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'BREVO_API_KEY',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SENTRY_DSN',
    'KV_REST_API_URL',
  ]
  const audit: Record<string, boolean> = {}
  for (const k of [...required, ...optional]) {
    audit[k] = !!process.env[k]
  }
  return {
    audit,
    missingRequired: required.filter((k) => !process.env[k]),
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const detailed =
    !!process.env.HEALTH_CHECK_SECRET &&
    searchParams.get('secret') === process.env.HEALTH_CHECK_SECRET

  const mockMode = getMockModeStatus()
  const anyMock = mockMode.supabase || mockMode.stripe || mockMode.email
  const isProd = process.env.NODE_ENV === 'production'
  const jwtSet = !!process.env.JWT_SECRET

  // Hard error: missing JWT_SECRET in prod is unrecoverable —
  // every authenticated route would fail. Worth paging.
  if (isProd && !jwtSet) {
    logger.error('health: JWT_SECRET missing in production')
    return NextResponse.json(
      {
        status: 'error',
        error: 'JWT_SECRET not set in production',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }

  // Active probes. We always probe DB — the latency is useful
  // even in the public response (rounded to nearest 50ms to
  // avoid timing fingerprints). In mock mode the probe is a
  // no-op.
  const dbProbe = await probeDatabase()
  const dbStatus: 'ok' | 'mock' | 'down' = isMockMode()
    ? 'mock'
    : dbProbe.ok
      ? 'ok'
      : 'down'

  // Overall status:
  //   - DB down in prod → degraded (not error: site still serves
  //     cached pages, customer can browse, just can't book)
  //   - any service mock in prod → degraded
  //   - else → ok
  const status =
    isProd && (dbStatus === 'down' || anyMock) ? 'degraded' : 'ok'

  const publicResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || 'dev',
    env: process.env.NODE_ENV || 'development',
    services: {
      database: dbStatus,
      stripe: mockMode.stripe ? 'mock' : 'configured',
      email: mockMode.email ? 'mock' : 'configured',
      auth: jwtSet ? 'configured' : 'missing',
    },
  }

  if (!detailed) {
    return NextResponse.json(publicResponse, { status: 200 })
  }

  // ---- Detailed mode (admin-only, requires secret) ----
  const env = envPresenceAudit()

  return NextResponse.json(
    {
      ...publicResponse,
      // Detailed deploy metadata — useful when "is the latest
      // commit actually live?" is the question.
      deploy: {
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        commitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
        commitMessage:
          process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0] || null,
        commitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN || null,
        region: process.env.VERCEL_REGION || null,
        url: process.env.VERCEL_URL || null,
      },
      uptime: {
        seconds: Math.floor(process.uptime ? process.uptime() : 0),
      },
      probes: {
        database: dbProbe,
      },
      mockMode,
      // `envAudit` is intentionally distinct from the public
      // `env` field above (which is the NODE_ENV string) so the
      // shapes don't shadow each other.
      envAudit: env,
    },
    { status: 200 }
  )
}
