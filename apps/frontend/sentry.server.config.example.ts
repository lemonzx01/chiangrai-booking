/**
 * Sentry server init for the frontend Next app.
 * Rename to `sentry.server.config.ts` after install.
 *
 * Frontend has minimal server-side work (just SSR for the
 * server components that fetch from the backend), but we
 * still want errors thrown there to surface in Sentry.
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [Sentry.consoleIntegration({ levels: [] })],

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
