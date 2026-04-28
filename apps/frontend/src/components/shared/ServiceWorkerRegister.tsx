/**
 * ServiceWorkerRegister — installs /sw.js on mount.
 *
 * Mounted once globally from (frontend)/layout.tsx. Defers
 * registration until window load so it never competes with
 * critical-path resources (the LCP image, fonts, etc.).
 *
 * Skipped when:
 *   - Browser doesn't support service workers (rare)
 *   - The site is already running standalone (no point —
 *     PWAs that have been installed always have a fresh SW)
 *   - We're in dev mode AND the user hasn't opted in via
 *     localStorage flag — service workers in dev cause cache
 *     headaches. Set `localStorage.dev_sw=1` to enable.
 */

'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Skip in dev unless explicitly opted in. Stale caches are
    // a productivity killer during local dev.
    if (process.env.NODE_ENV !== 'production') {
      try {
        if (window.localStorage.getItem('dev_sw') !== '1') return
      } catch {
        return
      }
    }

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {
          // Silent — failing to register the SW shouldn't surface
          // to the user. They just don't get the offline page.
        })
    }

    if (document.readyState === 'complete') {
      onLoad()
    } else {
      window.addEventListener('load', onLoad, { once: true })
      return () => window.removeEventListener('load', onLoad)
    }
  }, [])

  return null
}
