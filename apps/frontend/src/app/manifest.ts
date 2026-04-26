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
 * Icon paths point to /public assets that need to exist at build
 * time (see DEPLOYMENT.md for the icon checklist). If they don't
 * exist the manifest still serves; the browser just falls back to
 * the favicon.
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
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
