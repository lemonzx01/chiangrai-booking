/**
 * ============================================================
 * Sentry edge-runtime init
 * ============================================================
 *
 * Rename to `sentry.edge.config.ts` after install. This runs
 * for middleware (apps/backend/src/middleware.ts) and any
 * route handler that opts into the edge runtime via
 * `export const runtime = 'edge'`.
 *
 * Backend currently has no edge routes, but middleware DOES
 * run on the edge. Without this, errors thrown from
 * middleware (e.g. malformed CSRF tokens) never reach Sentry.
 * ============================================================
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  })
}
