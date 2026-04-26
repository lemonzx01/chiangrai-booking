/**
 * ============================================================
 * FloatingContact — bottom-right LINE / chat button
 * ============================================================
 *
 * One-tap access to the support channel from anywhere on the
 * site. Hides itself when the StickyBookBar is visible (mobile)
 * to avoid stacking two floating elements on a small screen.
 *
 * Defaults assume LINE Official Account, but the URL is
 * configurable via NEXT_PUBLIC_LINE_OA — set to a wa.me link
 * for WhatsApp, or any tel:/mailto:/https: URL.
 *
 * a11y:
 *   - `aria-label` is the visible tooltip text
 *   - The button is focusable and keyboard-clickable like any
 *     anchor.
 * ============================================================
 */

'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'

interface FloatingContactProps {
  /** URL to open. Defaults to env, or a sensible fallback. */
  href?: string
  /** Hide on detail pages where StickyBookBar is mobile-pinned. */
  hideOnMobileWhenStickyBarVisible?: boolean
}

const DEFAULT_HREF =
  process.env.NEXT_PUBLIC_LINE_OA || 'https://line.me/R/ti/p/@gotjourney'

export default function FloatingContact({
  href = DEFAULT_HREF,
  hideOnMobileWhenStickyBarVisible = false,
}: FloatingContactProps) {
  const [scrolled, setScrolled] = useState(false)

  // Reveal after a tiny scroll so it doesn't land on top of the
  // hero CTA. Slight delay also makes the button feel less in-your-face.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="ติดต่อทาง LINE / Contact via LINE"
      className={`fixed z-30 bottom-6 right-6 rounded-full shadow-xl transition-all duration-500 ${
        scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      } ${
        hideOnMobileWhenStickyBarVisible
          ? 'hidden md:inline-flex'
          : 'inline-flex'
      } items-center gap-2 px-4 py-3 bg-[#06C755] hover:bg-[#05b14b] text-white font-semibold focus-ring animate-pulse-glow`}
    >
      <MessageCircle size={20} />
      <span className="hidden sm:inline text-sm">ทักเราใน LINE</span>
    </a>
  )
}
