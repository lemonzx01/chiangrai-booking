'use client'

/**
 * ============================================================
 * Cookie Consent Banner
 * ============================================================
 *
 * Renders a non-blocking bottom-of-page banner on first visit.
 * User can "Accept" or "Decline" — either choice stores the
 * result in localStorage so the banner stays hidden on future
 * visits.
 *
 * Why analytics cookies need explicit consent:
 *   PDPA § 24(1) requires a specific, informed, unambiguous
 *   consent signal before processing data beyond what is
 *   strictly necessary to fulfill a contract. Essential
 *   cookies (login, CSRF) stay active regardless; analytics
 *   only turns on after accept.
 *
 * The global flag `window.__cookieConsent` is set so the
 * analytics loader (future Google Analytics / Plausible) can
 * read it before firing pageviews.
 * ============================================================
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'cookie_consent_v1'

type Decision = 'accepted' | 'declined'

declare global {
  interface Window {
    __cookieConsent?: Decision
  }
}

function readDecision(): Decision | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === 'accepted' || v === 'declined') return v
  } catch {
    // Private mode, locked storage — treat as no decision.
  }
  return null
}

function writeDecision(value: Decision) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore storage failures
  }
  window.__cookieConsent = value
}

export default function CookieConsent() {
  // `null` during SSR / before mount, then either decision or 'none'.
  const [decision, setDecision] = useState<Decision | 'none' | null>(null)

  useEffect(() => {
    const existing = readDecision()
    if (existing) {
      window.__cookieConsent = existing
      setDecision(existing)
    } else {
      setDecision('none')
    }
  }, [])

  if (decision === null || decision !== 'none') return null

  const accept = () => {
    writeDecision('accepted')
    setDecision('accepted')
  }
  const decline = () => {
    writeDecision('declined')
    setDecision('declined')
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
    >
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 p-2 bg-amber-100 rounded-xl">
            <Cookie className="text-amber-600" size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
              เราใช้คุกกี้ / We use cookies
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              คุกกี้จำเป็น (login, CSRF) ทำงานตลอด ส่วนคุกกี้วิเคราะห์จะเริ่มทำงานก็ต่อเมื่อท่านยอมรับ
              <br className="hidden sm:block" />
              Essential cookies (login, CSRF) are always active. Analytics cookies only run after you accept.{' '}
              <Link href="/privacy" className="text-slate-900 hover:underline">
                อ่านนโยบายความเป็นส่วนตัว
              </Link>
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={accept}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-800"
              >
                ยอมรับ / Accept
              </button>
              <button
                type="button"
                onClick={decline}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50"
              >
                ปฏิเสธ / Decline
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={decline}
            aria-label="Close"
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
