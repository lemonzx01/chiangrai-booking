/**
 * Sentry edge-runtime init for the frontend Next app.
 * Rename to `sentry.edge.config.ts` after install.
 *
 * Frontend has no middleware right now, but if one is added
 * later (e.g. geo-routing, AB-testing) it'll run on the edge
 * and need this config to report errors to Sentry.
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
