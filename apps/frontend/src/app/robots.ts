/**
 * ============================================================
 * robots.txt (Next.js App Router generated)
 * ============================================================
 *
 * Serves /robots.txt dynamically — lets search engines index
 * public pages but blocks admin, partner, API, and private
 * account areas that would never be useful in search results.
 *
 * The sitemap location is emitted too so crawlers can discover
 * hotels/cars without needing to guess.
 * ============================================================
 */

import type { MetadataRoute } from 'next'

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://gotjourneythailand.com'
  ).replace(/\/$/, '')
}

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        // Block admin/partner/API/checkout/profile — nothing useful to index.
        disallow: [
          '/admin',
          '/admin/',
          '/partner',
          '/partner/',
          '/api/',
          '/checkout',
          '/checkout/',
          '/profile',
          '/my-bookings',
          '/reset-password',
          '/verify-email',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
