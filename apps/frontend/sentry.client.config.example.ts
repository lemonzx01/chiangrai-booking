/**
 * ============================================================
 * Sentry client-side init (browser)
 * ============================================================
 *
 * Rename to `sentry.client.config.ts` after install. This is
 * what catches React errors, unhandled promise rejections,
 * and console.error from the customer's browser.
 *
 * Sample rates worth tuning:
 *   - tracesSampleRate: 0.1 in prod is fine to start. Higher
 *     means more performance traces (and more cost).
 *   - replaysSessionSampleRate: 0.05 means 5% of sessions are
 *     fully recorded. Replay is heavy bandwidth; start tiny.
 *   - replaysOnErrorSampleRate: 1.0 means EVERY session that
 *     hits an error gets a replay. Cheap, very high value.
 * ============================================================
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Strip URL query strings — bookings carry email + booking
    // codes in URLs that we don't want in Sentry's index.
    beforeSend(event) {
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url)
          // Keep path, drop query
          event.request.url = `${u.origin}${u.pathname}`
        } catch {
          // ignore
        }
      }
      return event
    },

    // Ignore errors caused by browser extensions and known
    // noise — these have very low signal value.
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection captured',
      // Common extension noise
      /Extension context invalidated/,
      /chrome-extension:\/\//,
    ],
  })
}
