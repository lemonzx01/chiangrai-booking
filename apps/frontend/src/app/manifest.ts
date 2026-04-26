/**
 * ============================================================
 * Web App Manifest (Next.js App Router generated)
 * ============================================================
 *
 * Serves /manifest.webmanifest. Lets Android/iOS users "Add to
 * Home Screen" and get a branded launcher icon instead of a
 * generic browser shortcut.
 *
 * Keeping this lightweight on purpose — no offline/service worker
 * support wired here, since the booking flow hits the backend on
 * every step and offline behaviour would just be misleading.
 *
 * Icons:
 *   - Default ships a single SVG (`/icon.svg`) which all modern
 *     browsers accept for PWA install. SVG scales to any size,
 *     so we don't need 192/512 PNG variants.
 *   - When real brand artwork lands, swap or add PNGs alongside
 *     the SVG (browsers pick the most appropriate).
 * ============================================================
 */

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Got Journey Thailand',
    short_name: 'GotJourney',
    description:
      'จองทริปเที่ยวพ่วงรถเช่าพรีเมียม — Book premium Thai travel with villa + car packages.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fafbfc',
    theme_color: '#4f46e5',
    lang: 'th-TH',
    categories: ['travel', 'lifestyle'],
    // Same SVG referenced twice with different `purpose` values.
    // The spec lets a single icon entry combine purposes ('any
    // maskable'), but Next.js's manifest type is strict, so we
    // express it as two entries. Browsers de-dup by src.
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
