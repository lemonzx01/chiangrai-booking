/**
 * ============================================================
 * Schema.org JSON-LD builders for individual listings
 * ============================================================
 *
 * Inline these in detail pages so Google can show rich
 * results (hotel cards with star rating, image, price range)
 * in search. The site-wide Organization + WebSite JSON-LD
 * already lives in app/layout.tsx; these are per-listing.
 *
 * Why hand-rolled instead of `schema-dts` types:
 *   The output is plain JSON — strict typing buys us little
 *   and adds a dep. We trade compile-time guarantees for a
 *   runtime sanity check (filterEmpty) so the emitted JSON
 *   never contains nulls or empties that confuse crawlers.
 * ============================================================
 */

const BRAND = 'Got Journey Thailand'

/** Site URL for absolute @id values. Falls back to the
 * production hostname so JSON-LD remains valid even when
 * NEXT_PUBLIC_SITE_URL is misconfigured. */
function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://gotjourneythailand.com'
  ).replace(/\/$/, '')
}

/**
 * Strip null/undefined/empty fields recursively. Keeps the
 * JSON-LD output tight; crawlers reject `"image": null`.
 */
function filterEmpty<T>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .map((v) => filterEmpty(v))
      .filter((v) => v !== null && v !== undefined && v !== '') as unknown as T
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (v === null || v === undefined || v === '') continue
      const cleaned = filterEmpty(v)
      if (
        Array.isArray(cleaned) &&
        cleaned.length === 0
      )
        continue
      if (
        cleaned &&
        typeof cleaned === 'object' &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned).length === 0
      )
        continue
      out[k] = cleaned
    }
    return out as T
  }
  return input
}

// ---------------------------------------------------------------
// Hotel
// ---------------------------------------------------------------

export interface HotelSchemaInput {
  id: string
  name: string                 // canonical (English preferred)
  alternateName?: string       // Thai name as alternate
  description: string
  images: string[]             // absolute or root-relative URLs
  location?: string | null     // free-text, e.g. "Pai, Mae Hong Son"
  starRating?: number | null   // 1..5
  pricePerNight: number
  currency?: string            // default THB
  /** Average rating from approved reviews, if known. */
  aggregateRating?: { value: number; count: number } | null
}

export function buildHotelSchema(h: HotelSchemaInput) {
  const url = siteUrl()
  const detailUrl = `${url}/hotels/${h.id}`
  const currency = h.currency || 'THB'

  return filterEmpty({
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': `${detailUrl}#hotel`,
    name: h.name,
    alternateName: h.alternateName,
    description: h.description,
    image: h.images,
    url: detailUrl,
    starRating: h.starRating
      ? { '@type': 'Rating', ratingValue: h.starRating }
      : null,
    address: h.location
      ? {
          '@type': 'PostalAddress',
          addressLocality: h.location,
          addressCountry: 'TH',
        }
      : null,
    priceRange: `฿${Math.round(h.pricePerNight).toLocaleString()}+`,
    // Schema.org doesn't have a "single offer" shape for Hotel,
    // but Google accepts an Offer with priceSpecification.
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: h.pricePerNight,
      url: detailUrl,
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: h.aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: h.aggregateRating.value,
          reviewCount: h.aggregateRating.count,
        }
      : null,
    publisher: { '@id': `${url}/#organization` },
  })
}

// ---------------------------------------------------------------
// Car (rental — modeled as Product since Schema.org has no
// dedicated Car-rental type; Google accepts Product for this
// kind of bookable inventory)
// ---------------------------------------------------------------

export interface CarSchemaInput {
  id: string
  name: string
  alternateName?: string
  description: string
  images: string[]
  carType?: string | null      // 'SUV', 'Sedan', etc.
  passengers?: number | null
  pricePerDay: number
  currency?: string
  aggregateRating?: { value: number; count: number } | null
}

export function buildCarSchema(c: CarSchemaInput) {
  const url = siteUrl()
  const detailUrl = `${url}/cars/${c.id}`
  const currency = c.currency || 'THB'

  return filterEmpty({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${detailUrl}#car`,
    name: c.name,
    alternateName: c.alternateName,
    description: c.description,
    image: c.images,
    url: detailUrl,
    category: c.carType ? `${c.carType} (Car rental)` : 'Car rental',
    additionalProperty: c.passengers
      ? [
          {
            '@type': 'PropertyValue',
            name: 'Maximum passengers',
            value: c.passengers,
          },
        ]
      : null,
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: c.pricePerDay,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: c.pricePerDay,
        priceCurrency: currency,
        unitText: 'DAY',
      },
      url: detailUrl,
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: c.aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: c.aggregateRating.value,
          reviewCount: c.aggregateRating.count,
        }
      : null,
    brand: {
      '@type': 'Brand',
      name: BRAND,
    },
  })
}

// ---------------------------------------------------------------
// Breadcrumb (used on every detail page)
// ---------------------------------------------------------------

export function buildBreadcrumbSchema(
  trail: Array<{ name: string; url: string }>
) {
  const url = siteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: step.url.startsWith('http') ? step.url : `${url}${step.url}`,
    })),
  }
}
