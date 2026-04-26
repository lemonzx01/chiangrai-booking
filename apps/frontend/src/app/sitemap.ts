/**
 * ============================================================
 * sitemap.xml (Next.js App Router generated)
 * ============================================================
 *
 * Emits /sitemap.xml on every request. Combines:
 *   - Static public routes (/, /hotels, /cars, /contact,
 *     /terms, /privacy, /login, /register)
 *   - Dynamic listing detail pages (/hotels/[id], /cars/[id])
 *     pulled from the backend API at request time
 *
 * The fetch to the backend is best-effort — if it fails we
 * still emit the static portion so the sitemap is never empty.
 * `cache: 'no-store'` is deliberate: listings change often and
 * this endpoint is hit infrequently by crawlers.
 * ============================================================
 */

import type { MetadataRoute } from 'next'
import { getBackendUrl } from '@/lib/api'

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://gotjourneythailand.com'
  ).replace(/\/$/, '')
}

interface ListingRow {
  id: string
  updated_at?: string | null
  created_at?: string | null
}

async function fetchListings(path: string): Promise<ListingRow[]> {
  try {
    const res = await fetch(`${getBackendUrl()}${path}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: ListingRow[] } | ListingRow[]
    const rows = Array.isArray(json) ? json : json.data || []
    return rows.filter((r) => !!r?.id)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const now = new Date()

  // Static entries — ordered roughly by importance so priority values
  // reflect a reasonable browsing hierarchy.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/hotels`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/cars`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Dynamic entries — best-effort; fallback to static-only if API fails.
  const [hotels, cars] = await Promise.all([
    fetchListings('/api/hotels'),
    fetchListings('/api/cars'),
  ])

  const hotelEntries: MetadataRoute.Sitemap = hotels.map((h) => ({
    url: `${base}/hotels/${h.id}`,
    lastModified: h.updated_at || h.created_at || now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
  const carEntries: MetadataRoute.Sitemap = cars.map((c) => ({
    url: `${base}/cars/${c.id}`,
    lastModified: c.updated_at || c.created_at || now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticEntries, ...hotelEntries, ...carEntries]
}
