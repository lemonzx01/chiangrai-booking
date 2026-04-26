# E2E tests (Playwright)

End-to-end tests that drive the real UI against the real backend, in mock mode. They're the safety net that unit tests can't be — a single Playwright run catches "this whole flow broke" regressions that 247 isolated unit tests would all happily pass through.

## What's covered

| File | What it tests |
|---|---|
| `e2e/smoke.spec.ts` | Public pages return 200, robots.txt + sitemap.xml + manifest + opengraph-image are reachable |
| `e2e/booking-flow.spec.ts` | Full happy path: home → hotels → detail → booking form → checkout → mock pay → success page shows a booking code |

The booking flow runs in **mock mode** — no Stripe, Supabase, or email keys required. The mock checkout page (`/checkout/mock`) simulates `checkout.session.completed` so the webhook + booking → PAID transition gets exercised too.

## First-time setup

Playwright isn't in the repo's `package.json` by default — it pulls in a ~200MB Chromium browser. Install when you're ready:

```bash
npm install -D @playwright/test
npm run test:e2e:install     # downloads chromium
```

## Running

The `webServer` block in `playwright.config.ts` boots both Next apps in mock mode automatically:

```bash
npm run test:e2e             # headless, all tests
npm run test:e2e:ui          # opens the Playwright UI for debugging
```

If you already have `npm run dev` running and prefer to reuse it:

```bash
E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

That short-circuits the webServer block.

## CI

`.github/workflows/e2e.yml` (when added) should:

```yaml
- run: npm ci
- run: npx playwright install --with-deps chromium
- run: npm run test:e2e
  env:
    CI: 'true'
```

`CI=true` makes Playwright retry failures twice and fail-fast on `.only`.

## Debugging a failing test

1. Run with the UI runner: `npm run test:e2e:ui`
2. Or run a single test in headed mode: `npx playwright test booking-flow --headed --debug`
3. Failure artifacts (screenshots, videos, traces) land in `playwright-report/`

## When to add a new E2E test

New E2E tests are expensive — each one takes seconds, not milliseconds — so reserve them for:

- **Money flows**: any path that mutates a booking, charges a card, refunds, or changes a partner's payout config
- **Admin destructive actions**: bulk operations, deletes, moderation
- **Auth boundaries**: confirming a non-admin can't reach `/admin/*`

Routine UI changes belong in unit / component tests. Use the budget for things that are catastrophic if they break.
