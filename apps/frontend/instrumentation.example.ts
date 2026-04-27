/**
 * ============================================================
 * Next.js instrumentation entry — Sentry boot for frontend
 * ============================================================
 *
 * Rename to `instrumentation.ts` to activate (after running
 * `npm install @sentry/nextjs`).
 *
 * Three runtimes can run code in a Next.js app:
 *   - nodejs: server components, API routes (frontend has none),
 *     getServerSideProps-ish flows
 *   - edge:   middleware
 *   - browser: client components — handled separately by
 *     `sentry.client.config.ts` which Sentry's webpack plugin
 *     picks up automatically; we don't import it here
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
    // ignore
  }
}
