/**
 * ============================================================
 * E2E: smoke tests — core pages render without 500
 * ============================================================
 *
 * Cheap "is the site alive" check that catches the obvious
 * broken-deploy class of bugs (missing env, broken layout,
 * SSR exception). Faster than the full booking flow and
 * covers a different set of regressions.
 *
 * Run:
 *   npm run test:e2e
 * ============================================================
 */

import { test, expect } from '@playwright/test'

const PUBLIC_PAGES = [
  { path: '/', titleHint: /Got Journey/ },
  { path: '/hotels', titleHint: /Got Journey/ },
  { path: '/cars', titleHint: /Got Journey/ },
  { path: '/contact', titleHint: /Got Journey/ },
  { path: '/terms', titleHint: /Got Journey/ },
  { path: '/privacy', titleHint: /Got Journey/ },
  { path: '/login', titleHint: /Got Journey/ },
]

test.describe('smoke', () => {
  for (const { path, titleHint } of PUBLIC_PAGES) {
    test(`GET ${path} returns 200 + title`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBeLessThan(400)
      await expect(page).toHaveTitle(titleHint)
    })
  }

  test('robots.txt has a sitemap reference', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body.toLowerCase()).toContain('sitemap')
  })

  test('sitemap.xml is valid XML and lists at least the home page', async ({
    request,
  }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body).toContain('<?xml')
    expect(body).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/)
  })

  test('manifest.webmanifest declares the app name', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.name).toBeTruthy()
    expect(body.icons?.length).toBeGreaterThan(0)
  })

  test('opengraph-image returns a PNG', async ({ request }) => {
    const res = await request.get('/opengraph-image')
    expect(res.ok()).toBeTruthy()
    expect(res.headers()['content-type']).toContain('image/')
  })
})
