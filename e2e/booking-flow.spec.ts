/**
 * ============================================================
 * E2E: customer happy-path booking flow (mock mode)
 * ============================================================
 *
 * The booking flow is the core of the business. This is the
 * one path that absolutely must always work. Unit tests don't
 * exercise it end-to-end (they stop at individual functions),
 * so a single Playwright script that walks the real UI with
 * the mock backend is the most important integration test
 * we can have.
 *
 * Steps:
 *   1. Land on /
 *   2. Navigate to /hotels
 *   3. Click into a hotel detail
 *   4. Click "จองเลย" — lands on /booking
 *   5. Fill the booking form (dates, guest info)
 *   6. Submit — lands on /checkout
 *   7. Click "Pay now" — lands on /checkout/mock (mock Stripe)
 *   8. Click "Pay" — lands on /success
 *   9. Verify booking code is shown
 *
 * Run:
 *   npm run test:e2e
 * ============================================================
 */

import { test, expect } from '@playwright/test'

test.describe('booking happy path', () => {
  test('customer can complete a hotel booking in mock mode', async ({ page }) => {
    // 1. Home loads
    await page.goto('/')
    await expect(page).toHaveTitle(/Got Journey/)

    // 2. Navigate to hotel listing
    await page.goto('/hotels')
    // Wait for at least one card to render (mock data)
    await page.waitForSelector('a[href^="/hotels/"]', { timeout: 15_000 })
    const firstHotel = page.locator('a[href^="/hotels/"]').first()
    await expect(firstHotel).toBeVisible()

    // 3. Open detail page
    await firstHotel.click()
    await page.waitForURL(/\/hotels\/[^/]+$/)

    // 4. Hit the "จองเลย" CTA — could be in StickyBookBar or
    //    the inline booking section. Either targets a /booking link.
    const bookLink = page.locator('a[href*="/booking?type=HOTEL"]').first()
    await expect(bookLink).toBeVisible()
    await bookLink.click()
    await page.waitForURL(/\/booking/)

    // 5. Fill the form. The form mounts custom date pickers, so
    //    we drive it via the underlying input names rather than
    //    trying to click the calendar widgets.
    const today = new Date()
    const checkIn = new Date(today.getTime() + 7 * 86400_000)
    const checkOut = new Date(today.getTime() + 9 * 86400_000)
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    // The booking page has React-controlled date pickers; rather
    // than fight them, use the date input fallbacks (HTML5 type=date
    // shows up on most pages). If your form uses pure custom pickers,
    // adapt this block to call into them via test ids.
    const dateInputs = page.locator('input[type="date"]')
    const dateCount = await dateInputs.count()
    if (dateCount >= 2) {
      await dateInputs.nth(0).fill(iso(checkIn))
      await dateInputs.nth(1).fill(iso(checkOut))
    }

    // Customer info — backend Zod requires name ≥ 2 chars,
    // valid email, phone ≥ 9 digits.
    await page.fill('input[name="customer_name"], input[placeholder*="ชื่อ"]', 'Playwright Tester')
    await page.fill(
      'input[name="customer_email"], input[type="email"]',
      'playwright@example.com'
    )
    await page.fill(
      'input[name="customer_phone"], input[type="tel"]',
      '0812345678'
    )

    // 6. Submit
    await page.locator('button[type="submit"]').first().click()

    // The booking POST goes to /api/bookings, then the page
    // either pushes /checkout or shows a confirmation. We
    // accept either as long as the URL contains 'checkout' or
    // 'success' within 30s.
    await page.waitForURL(/\/(checkout|success)/, { timeout: 30_000 })

    // 7+8: if we landed on /checkout, click pay → mock Stripe
    if (page.url().includes('/checkout')) {
      // Click whichever payment method is selected by default
      await page.locator('button:has-text("ชำระเงิน"), button:has-text("Pay")').first().click()
      await page.waitForURL(/\/(checkout\/mock|success)/, { timeout: 30_000 })

      if (page.url().includes('/checkout/mock')) {
        await page.locator('button:has-text("Pay"), button:has-text("ชำระเงิน")').first().click()
        await page.waitForURL(/\/success/, { timeout: 30_000 })
      }
    }

    // 9. Success page mentions a booking code somewhere on it
    await expect(page).toHaveURL(/\/success/)
    const body = page.locator('body')
    // Booking codes follow the pattern XX{YYMMDD}-{4 chars}
    await expect(body).toContainText(/[A-Z]{2}\d{6}-[A-Z0-9]{4}/)
  })
})
