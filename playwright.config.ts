/**
 * ============================================================
 * Playwright config — E2E tests
 * ============================================================
 *
 * Setup:
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *
 * Run (mock mode, no real services needed):
 *   npm run test:e2e
 *
 * The webServer block boots both apps in mock mode before the
 * tests run, so the suite is self-contained — no manual
 * `npm run dev` first.
 * ============================================================
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const playwrightModule: any = (() => {
  try {
    // Dynamic require so this file still imports cleanly in
    // environments where Playwright isn't installed yet —
    // helpful for the rest of the toolchain (tsc, lint).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@playwright/test')
  } catch {
    return { defineConfig: (c: unknown) => c, devices: {} }
  }
})()

const { defineConfig, devices } = playwrightModule

export default defineConfig({
  testDir: './e2e',
  // Run sequentially. The webServer below uses `npm run dev`, which
  // compiles routes on first hit; 6 parallel workers slamming cold
  // routes simultaneously blows the 30s default timeout for no
  // reason on a real app. Sequential is "slow but never flaky".
  fullyParallel: false,
  workers: 1,
  // First cold compile of a heavy page (e.g. /login with i18n) can
  // legitimately take ~40s on Windows; 60s gives headroom without
  // hiding actual stalls.
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Boot frontend (3000) + backend (3001) in mock mode.
        // Mock mode is automatic when SUPABASE_URL is unset, which
        // it is by default on a clean dev box.
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
