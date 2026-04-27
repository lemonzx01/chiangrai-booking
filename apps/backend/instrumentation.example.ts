/**
 * ============================================================
 * Next.js instrumentation entry — Sentry boot for backend
 * ============================================================
 *
 * Rename this file to `instrumentation.ts` to activate.
 *
 * Next.js calls `register()` once per runtime (Node, Edge,
 * Browser) before any route handler runs. We use it to lazy-
 * import the right sentry.*.config.ts so the SDK initializes
 * with the runtime-appropriate transport.
 *
 * If `@sentry/nextjs` isn't installed, the dynamic imports
 * fail silently and the app keeps running without telemetry.
 * Pair with the SENTRY_DSN env var — leave it blank in dev
 * to disable Sentry locally.
 * ============================================================
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config').catch(() => {})
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config').catch(() => {})
  }
}

/**
 * Forward server-side errors to Sentry.
 *
 * Next.js calls this for any unhandled error in server components
 * or route handlers. Without it, those errors only show up in
 * Vercel logs and never reach Sentry.
 */
export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry: any = await import('@sentry/nextjs').catch(() => null)
    if (!Sentry) return
    Sentry.captureRequestError?.(err, request, context)
  } catch {
    // ignore — telemetry failure must not block requests
  }
}
