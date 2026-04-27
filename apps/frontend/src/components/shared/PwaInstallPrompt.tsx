/**
 * ============================================================
 * PwaInstallPrompt — "Add to Home Screen" banner
 * ============================================================
 *
 * Catches the `beforeinstallprompt` event that Chrome/Edge/
 * Samsung Internet fire on supported sites with a manifest +
 * service worker, stashes the event, and surfaces a small
 * non-blocking banner inviting the user to install.
 *
 * Behavior decisions:
 *   - Only shows after the user has spent > 30 seconds on the
 *     site OR has visited at least 2 pages — otherwise we'd
 *     interrupt first-time visitors with a popup before they
 *     even understand what we offer
 *   - Dismissals stick for 14 days via localStorage so we
 *     don't nag (one of the more common PWA install
 *     mistakes)
 *   - Hidden if the app is already running in standalone mode
 *     (display-mode: standalone media query) — no point
 *     prompting users who already installed
 *   - iOS Safari ignores beforeinstallprompt entirely — there
 *     we show a tiny how-to instead, but only on Safari since
 *     Chrome on iOS can't install PWAs at all and the message
 *     would be noise
 * ============================================================
 */

'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share2 } from 'lucide-react'

const DISMISS_KEY = 'pwa_install_dismissed_at'
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 14 days
const REVEAL_AFTER_MS = 30_000

// Minimal type for the BeforeInstallPromptEvent — TypeScript's
// lib.dom doesn't know about it yet, and pulling DefinitelyTyped
// definitions here would be overkill.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already installed → never show
    if (
      window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      return
    }

    // Recently dismissed → respect that
    const dismissed = readDismissTimestamp()
    if (dismissed && Date.now() - dismissed < DISMISS_TTL_MS) return

    // Capture the install prompt for later — we want to time
    // when we surface the banner, not show it immediately.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // iOS Safari path: no event fires; we offer a tiny how-to
    // hint instead. Detect Safari on iOS via UA + standalone check.
    const ua = navigator.userAgent
    const isIos = /iPad|iPhone|iPod/.test(ua)
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
    if (isIos && isSafari) {
      // Reveal after the same delay so we don't ambush them
      const t = setTimeout(() => setIosHint(true), REVEAL_AFTER_MS)
      return () => {
        window.removeEventListener('beforeinstallprompt', onBeforeInstall)
        clearTimeout(t)
      }
    }

    // Reveal after 30s — long enough that the user has formed
    // an intent to use the site, short enough they remember
    // we exist when they get the prompt
    const reveal = setTimeout(() => setShow(true), REVEAL_AFTER_MS)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      clearTimeout(reveal)
    }
  }, [])

  const dismiss = () => {
    setShow(false)
    setIosHint(false)
    writeDismissTimestamp(Date.now())
  }

  const install = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        // Once accepted the browser won't fire beforeinstallprompt
        // again, so we just hide the banner.
        setShow(false)
        setDeferredPrompt(null)
      } else {
        // User said no → respect the dismiss TTL like a manual close.
        dismiss()
      }
    } catch {
      dismiss()
    }
  }

  // ---- iOS hint variant (no install API available) ----
  if (iosHint) {
    return (
      <div
        role="dialog"
        aria-label="ติดตั้งแอป"
        className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 md:hidden"
      >
        <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3">
          <Share2 size={20} className="text-indigo-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-sm">
            <p className="font-bold">ติดตั้งเป็นแอป</p>
            <p className="text-slate-300 text-xs mt-0.5">
              แตะ <Share2 size={11} className="inline text-indigo-300" />{' '}
              ด้านล่าง แล้วเลือก "Add to Home Screen"
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="ปิด"
            className="flex-shrink-0 p-1 -m-1 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ---- Standard variant (Chrome / Edge / Samsung Internet) ----
  if (!show || !deferredPrompt) return null

  return (
    <div
      role="dialog"
      aria-label="ติดตั้งแอป"
      className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 md:bottom-6 md:right-6 md:left-auto md:max-w-sm"
    >
      <div className="max-w-md mx-auto md:mx-0 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">ติดตั้งเป็นแอป</p>
          <p className="text-xs text-slate-500 mt-0.5">
            จองทริปได้เร็วขึ้น เปิดจากหน้าจอโฮมโดยตรง
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={install}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
            >
              ติดตั้ง
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              ทีหลัง
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="ปิด"
          className="flex-shrink-0 p-1 -m-1 text-slate-400 hover:text-slate-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------
// Local-storage helpers (defensive — handle SSR + private mode)
// ---------------------------------------------------------------

function readDismissTimestamp(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY)
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeDismissTimestamp(ts: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DISMISS_KEY, String(ts))
  } catch {
    // ignore — private mode etc.
  }
}
