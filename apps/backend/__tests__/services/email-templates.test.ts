/**
 * ============================================================
 * Email layout / template tests
 * ============================================================
 *
 * Email rendering is one of those areas where a typo silently
 * goes to production for weeks. These tests pin the contract
 * around HTML escaping (most important — XSS through name
 * fields is real), preheader behavior, CTA wiring, and the
 * specific output of the booking confirmation template.
 * ============================================================
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/constants', () => ({
  APP_NAME: 'Got Journey Thailand',
}))

import {
  escapeHtml,
  wrapEmail,
  renderDetailCard,
  renderAmountHero,
  renderTrustBadges,
  BRAND,
} from '@/services/notifications/templates/layout'
import { renderBookingConfirmationEmail } from '@/services/notifications/templates/bookingConfirmation'

describe('escapeHtml', () => {
  it('escapes the five HTML-unsafe characters', () => {
    expect(escapeHtml(`<script>alert("x")&'</script>`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;&lt;/script&gt;'
    )
  })

  it('returns empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('coerces non-strings via String()', () => {
    expect(escapeHtml(123)).toBe('123')
    expect(escapeHtml(true)).toBe('true')
  })
})

describe('wrapEmail', () => {
  it('renders the heading at the top', () => {
    const html = wrapEmail({ heading: 'Hello World', body: '<p>body</p>' })
    expect(html).toContain('Hello World')
    expect(html).toContain('<p>body</p>')
  })

  it('escapes the heading (XSS guard)', () => {
    const html = wrapEmail({
      heading: '<img src=x onerror=alert(1)>',
      body: '',
    })
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('renders an eyebrow tag when provided', () => {
    const html = wrapEmail({ heading: 'h', body: '', eyebrow: 'Confirmed' })
    expect(html).toContain('Confirmed')
    expect(html).toContain('text-transform:uppercase')
  })

  it('renders a CTA button with the given URL and label', () => {
    const html = wrapEmail({
      heading: 'h',
      body: '',
      cta: { label: 'View booking', url: 'https://example.com/x' },
    })
    expect(html).toContain('href="https://example.com/x"')
    expect(html).toContain('View booking')
  })

  it('escapes CTA url + label so attacker-controlled values are safe', () => {
    const html = wrapEmail({
      heading: 'h',
      body: '',
      cta: { label: '<x>', url: 'javascript:alert(1)' },
    })
    // label is escaped
    expect(html).not.toContain('<x>')
    expect(html).toContain('&lt;x&gt;')
    // url goes through escapeHtml — quotes survive but angle brackets escape
    expect(html).toContain('href="javascript:alert(1)"')
  })

  it('omits CTA block when not provided', () => {
    const html = wrapEmail({ heading: 'h', body: '<p>x</p>' })
    // Brand bar + footer links exist, so we can't simply check
    // for "<a href=" — instead look for the CTA's distinctive
    // padding:14px 28px style which is unique to that block.
    expect(html).not.toMatch(/padding:14px 28px/)
  })

  it('emits a hidden preheader when supplied', () => {
    const html = wrapEmail({
      heading: 'h',
      body: '',
      preheader: 'Order confirmed for 2 nights',
    })
    expect(html).toContain('Order confirmed for 2 nights')
    expect(html).toContain('display:none')
  })

  it('uses brand surface as the page background', () => {
    const html = wrapEmail({ heading: 'h', body: '' })
    expect(html).toContain(BRAND.surface)
  })
})

describe('renderDetailCard', () => {
  it('skips rows with null/undefined/empty values', () => {
    const html = renderDetailCard('Card', [
      { label: 'A', value: 'visible' },
      { label: 'B', value: null },
      { label: 'C', value: undefined },
      { label: 'D', value: '' },
    ])
    expect(html).toContain('visible')
    expect(html).not.toContain('>B</span>')
    expect(html).not.toContain('>C</span>')
    expect(html).not.toContain('>D</span>')
  })

  it('escapes both labels and values', () => {
    const html = renderDetailCard('Card', [
      { label: '<script>', value: 'safe' },
      { label: 'attr', value: '<img>' },
    ])
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;img&gt;')
  })
})

describe('renderAmountHero', () => {
  it('shows label and amount with brand colors', () => {
    const html = renderAmountHero('Total', '฿1,500')
    expect(html).toContain('Total')
    expect(html).toContain('฿1,500')
    expect(html).toContain(BRAND.primary)
  })
})

describe('renderTrustBadges', () => {
  it('renders the three reassurance badges', () => {
    const html = renderTrustBadges()
    expect(html).toContain('ยกเลิกฟรี')
    expect(html).toContain('ปลอดภัย')
    expect(html).toContain('24/7')
  })
})

describe('renderBookingConfirmationEmail', () => {
  const sample = {
    customerName: 'สมชาย ใจดี',
    bookingCode: 'TE260427-AB12',
    itemName: 'Premium Villa Chiang Rai',
    checkIn: '2026-05-01',
    checkOut: '2026-05-04',
    totalPrice: 12500,
    status: 'PAID',
  }

  it('builds a subject containing the booking code', () => {
    const { subject } = renderBookingConfirmationEmail(sample)
    expect(subject).toContain('TE260427-AB12')
  })

  it('renders the customer name in the body', () => {
    const { html } = renderBookingConfirmationEmail(sample)
    expect(html).toContain('สมชาย ใจดี')
  })

  it('escapes a malicious customer name', () => {
    const { html } = renderBookingConfirmationEmail({
      ...sample,
      customerName: '<script>alert(1)</script>',
    })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('renders the amount hero with formatted total', () => {
    const { html } = renderBookingConfirmationEmail(sample)
    expect(html).toContain('12,500')
  })

  it('renders detail rows for both check-in and check-out', () => {
    const { html } = renderBookingConfirmationEmail(sample)
    expect(html).toContain('วันเช็คอิน')
    expect(html).toContain('วันเช็คเอาท์')
    expect(html).toContain('2026-05-01')
    expect(html).toContain('2026-05-04')
  })

  it('renders a CTA when bookingUrl is supplied', () => {
    const { html } = renderBookingConfirmationEmail({
      ...sample,
      bookingUrl: 'https://example.com/b/TE260427-AB12',
    })
    expect(html).toContain('https://example.com/b/TE260427-AB12')
  })

  it('omits the CTA when no bookingUrl', () => {
    const { html } = renderBookingConfirmationEmail(sample)
    expect(html).not.toMatch(/padding:14px 28px/)
  })
})
