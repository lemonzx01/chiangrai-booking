/**
 * Service Worker — minimal offline shell + asset cache
 * ============================================================
 *
 * Scope of this SW:
 *   - Cache the app shell (offline page + minimal CSS/icons)
 *     so visitors hitting the site without connectivity get a
 *     branded "เครือข่ายขาด" page instead of the browser's
 *     "no internet" screen.
 *   - Network-first strategy for navigations (HTML pages).
 *     If the network fails, fall back to /offline.
 *   - Cache-first for the icon.svg + manifest because those
 *     are tiny and unchanging.
 *
 * What this SW DELIBERATELY DOES NOT DO:
 *   - Cache booking / payment endpoints. The whole point of
 *     a booking system is real-time availability — serving a
 *     stale "rooms available" response would lead to
 *     overbooking.
 *   - Background sync. Adds complexity without clear ROI.
 *   - Push notifications. That needs a separate VAPID setup
 *     and isn't wired yet.
 *
 * Versioning: bump CACHE_VERSION whenever this file changes
 * to force a clean cache on the user's next visit. Old
 * caches are pruned in the activate handler.
 * ============================================================
 */

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`

// Pre-cache the offline page + core assets on install.
const PRECACHE_URLS = ['/offline', '/icon.svg', '/manifest.webmanifest']

// ---- Install: warm the cache --------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => {
        // Pre-cache failures (e.g. /offline 404'd because page
        // hasn't deployed yet) shouldn't break SW install;
        // just continue without warm cache.
      })
  )
})

// ---- Activate: drop old version caches ----------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.endsWith(`-${CACHE_VERSION}`))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ---- Fetch: route-by-route caching strategy ----------------
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests. Cross-origin (Stripe,
  // Supabase, Unsplash) goes straight to the network — caching
  // them would waste storage.
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return
  }

  // Never touch API requests — those need to be live.
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Navigation requests: network-first, fall back to /offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Successful navigation? Stash a copy in runtime cache
          // so a later offline visit to the same URL works too.
          if (response.ok) {
            const clone = response.clone()
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, clone))
              .catch(() => {})
          }
          return response
        })
        .catch(() =>
          // Try the runtime cache first (last successful visit
          // to this URL), then fall back to the offline page.
          caches.match(request).then(
            (cached) =>
              cached ||
              caches.match('/offline').then((page) => page || fallbackOffline())
          )
        )
    )
    return
  }

  // Static assets (manifest, svg, fonts): cache-first.
  if (
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/icon' ||
    url.pathname === '/apple-icon'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone))
            }
            return response
          })
      )
    )
    return
  }

  // Everything else: network-only (just let the browser handle it)
})

// ---- Fallback offline response (when even /offline isn't cached) ----
function fallbackOffline() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="utf-8">
      <title>เครือข่ายขาด — Got Journey Thailand</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px;}
        .card{max-width:420px;text-align:center;background:white;border-radius:16px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,0.06);}
        h1{margin:0 0 8px 0;font-size:20px;font-weight:800;}
        p{margin:0 0 16px 0;color:#64748b;font-size:14px;line-height:1.6;}
        button{background:#4f46e5;color:white;border:none;border-radius:10px;padding:10px 20px;font-weight:700;cursor:pointer;font-size:14px;}
      </style>
    </head>
    <body>
      <div class="card">
        <h1>เครือข่ายขาด</h1>
        <p>ดูเหมือนคุณไม่ได้เชื่อมต่ออินเทอร์เน็ต<br>กรุณาตรวจสอบและลองใหม่อีกครั้ง</p>
        <button onclick="location.reload()">ลองใหม่</button>
      </div>
    </body>
    </html>`,
    {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 200,
    }
  )
}
