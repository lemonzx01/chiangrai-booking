/**
 * ============================================================
 * Sentry server-side init (Node runtime)
 * ============================================================
 *
 * Rename to `sentry.server.config.ts` after installing
 * @sentry/nextjs.
 *
 * What this captures:
 *   - Unhandled errors in server components
 *   - Exceptions thrown in route handlers
 *   - Anything emitted via lib/logger.ts at error/fatal level
 *     (the logger has its own Sentry hook that picks this SDK
 *     up the moment it's initialized)
 *
 * What it WON'T capture (by design):
 *   - debug / info logs — would flood the inbox
 *   - PII — the logger sanitizes before forwarding, and the
 *     beforeSend hook below does a second pass
 * ============================================================
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Tracing: 10% sample in prod, 100% in dev. Tracing is the
    // expensive part of Sentry's bill — keep this conservative.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Don't ship console breadcrumbs from the server — they
    // double up with our own logger output.
    integrations: [
      Sentry.consoleIntegration({ levels: [] }),
    ],

    // Defense-in-depth: strip cookies / authorization headers
    // before they leave the box. Logger.sanitize already does this
    // for explicit log calls; this catches uncaught exceptions
    // where context is built by the SDK.
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies
      if (event.request?.headers) {
        delete event.request.headers['cookie']
        delete event.request.headers['authorization']
      }
      return event
    },
  })
}
