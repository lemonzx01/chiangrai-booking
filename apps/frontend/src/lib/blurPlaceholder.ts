/**
 * ============================================================
 * blurPlaceholder — tiny inline data-URL for next/image's `blurDataURL`
 * ============================================================
 *
 * Why not generate per-image placeholders:
 *   Next.js's `placeholder="blur"` requires a base64 image that
 *   ships in the HTML. Generating one per image at build time
 *   means crawling Supabase / Unsplash, which is slow and
 *   couples the build to remote storage. A single 16×16 grey
 *   blur is good enough to mask layout shift while the real
 *   image loads, and weighs ~150 bytes inline.
 *
 * Usage:
 *   <Image
 *     src={url}
 *     alt={...}
 *     placeholder="blur"
 *     blurDataURL={SHIMMER_DATA_URL}
 *   />
 * ============================================================
 */

/** 16×16 PNG, light-grey, 1px blurred. */
export const SHIMMER_DATA_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#e2e8f0'/>
          <stop offset='100%' stop-color='#cbd5e1'/>
        </linearGradient>
      </defs>
      <rect width='16' height='16' fill='url(#g)'/>
    </svg>`
  )

/**
 * Blur placeholder for the hero artwork (home hero + auth BrandPanel).
 *
 * This is the real photograph at 16px wide, not an approximation: a
 * synthetic gradient guesses the colours and the swap to the real image
 * is visible, whereas a genuine downscale shares the photo's sky/temple
 * split so the transition reads as the image sharpening.
 *
 * 340 bytes. Unsplash's own 16px response is ~3.5 KB because it carries
 * a full ICC profile; the APPn/COM segments are stripped here, which is
 * ~90% of the file at this size.
 *
 * Regenerate (if the hero art changes):
 *   curl "<unsplash-url>?auto=format&fit=crop&w=16&q=35&fm=jpg" -o t.jpg
 *   then strip APP0-APP15 + COM markers and base64 the result.
 */
export const HERO_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/2wCEAAgJCQsOCw8QEA8UFhQWFB4bGRkbHiwgIiAiICxDKjEqKjEqQztIOzc7SDtqU0pKU2p6Z2JnepSFhZS6sbrz8/8BCAkJCw4LDxAQDxQWFBYUHhsZGRseLCAiICIgLEMqMSoqMSpDO0g7NztIO2pTSkpTanpnYmd6lIWFlLqxuvPz///AABEIAAsAEAMBIgACEQEDEQH/xABjAAEBAQAAAAAAAAAAAAAAAAAGAwUQAAIBBAIDAQAAAAAAAAAAAAEDAgAEERIhMQUicVEBAQEAAAAAAAAAAAAAAAAAAAMEEQEAAQMFAQAAAAAAAAAAAAABAgADQQUREhQiMf/aAAwDAQACEQMRAD8AXePvVuWGGRkOcw4GpH7VrK6Qprl7CMwd5SHXHcR8oIr1WvBI3YRLnsYrRfbr0yAQfpqCWp3uAILKYOPlJ1bRcz53DNf/2Q=='
