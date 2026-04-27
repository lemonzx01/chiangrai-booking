# Sentry setup

Error tracking + performance monitoring for both apps. Without Sentry, you only see what Vercel's `/logs` viewer shows you, which is unsearchable, has no aggregation, and does not alert on regressions. Sentry is worth wiring before public launch.

## Why this isn't already on by default

- `@sentry/nextjs` pulls in ~600KB of client bundle (Replay alone is ~150KB) and adds a build step. Worth it for production but heavy for local dev.
- Sentry costs money. Free tier covers 5k errors/month — fine for a small app, but the team should sign up before it's wired so it doesn't get spammed during dev.

The `lib/logger.ts` server-side hook is **already wired** — it forwards `warn`/`error`/`fatal` events to Sentry as soon as the SDK initializes. The config files in this guide just initialize the SDK.

## Step 1 — Sign up + get the DSN

1. Create a project at https://sentry.io (Next.js platform)
2. Copy the DSN from "Settings → Client Keys"
3. Set in Vercel:
   ```
   SENTRY_DSN=https://...@sentry.io/...
   NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
   ```
   (Same DSN for both — `NEXT_PUBLIC_` is what the browser bundle reads.)

## Step 2 — Install the SDK in each app

```bash
npm install --workspace=backend  @sentry/nextjs
npm install --workspace=frontend @sentry/nextjs
```

## Step 3 — Activate the config files

We ship the configs as `.example.ts`. Activate by renaming:

**Backend** (`apps/backend/`):

```bash
cd apps/backend
mv instrumentation.example.ts        instrumentation.ts
mv sentry.server.config.example.ts   sentry.server.config.ts
mv sentry.edge.config.example.ts     sentry.edge.config.ts
```

**Frontend** (`apps/frontend/`):

```bash
cd apps/frontend
mv instrumentation.example.ts        instrumentation.ts
mv sentry.client.config.example.ts   sentry.client.config.ts
mv sentry.server.config.example.ts   sentry.server.config.ts
mv sentry.edge.config.example.ts     sentry.edge.config.ts
```

## Step 4 — Wrap `next.config.mjs` (frontend only)

Sentry's webpack plugin uploads source maps so stack traces are readable. The wrapper goes at the bottom of `apps/frontend/next.config.mjs`:

```js
import { withSentryConfig } from '@sentry/nextjs'

// ... existing nextConfig ...

const sentryOptions = {
  silent: process.env.NODE_ENV !== 'production',
  org: 'your-org-slug',
  project: 'chiangrai-booking-frontend',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: true,
  disableLogger: true,
}

export default withSentryConfig(nextConfig, sentryOptions)
```

The `SENTRY_AUTH_TOKEN` (different from the DSN) goes in Vercel — get it from "Settings → Account → API → Auth Tokens" with `project:releases` + `org:read` scopes.

## Step 5 — Test before declaring victory

Add a test route that throws:

```ts
// apps/backend/src/app/api/_sentry-test/route.ts
export const dynamic = 'force-dynamic'
export async function GET() {
  throw new Error('Sentry smoke test')
}
```

Hit it once, check the Sentry dashboard — the error should appear within 30 seconds with stack frames pointing at the right file. **Delete the route** after confirming.

## What gets captured

- **Server-side**: every unhandled exception in route handlers / server components, plus anything emitted via `logger.error()` / `logger.warn()` / `logger.fatal()`. PII is sanitized by `lib/logger.ts` before forwarding.
- **Client-side**: React error boundary errors, unhandled promise rejections, plus session replay on errors (5% session sampling, 100% on errors).
- **Edge runtime**: errors thrown in `apps/backend/src/middleware.ts` (CSRF token verification, etc.).

## Sampling rate guidance

`tracesSampleRate` defaults to `0.1` in production (10% of requests carry a trace). Tracing is the biggest contributor to your Sentry bill — keep it conservative until you actually need traces. Errors are always sampled at 100%.

`replaysSessionSampleRate: 0.05` records 5% of all sessions. `replaysOnErrorSampleRate: 1.0` records every session that hits an error — cheap and very high value.

## What this doesn't cover

- **Audit logs** — those go to `admin_audit_log` (Postgres), not Sentry. Different audience, different retention.
- **Customer support tickets** — Sentry isn't a CRM.
- **Uptime monitoring** — point a service like UptimeRobot at `/api/health` for that.
