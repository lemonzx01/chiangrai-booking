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
