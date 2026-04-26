/**
 * ============================================================
 * useScrollReveal — IntersectionObserver-driven entry animations
 * ============================================================
 *
 * Pattern: pass the returned ref to any element. When the element
 * scrolls into view (within `threshold` of the viewport), the
 * `revealed` flag flips to true and stays true. Pair it with
 * Tailwind's animate-* classes:
 *
 *   const { ref, revealed } = useScrollReveal()
 *   <div ref={ref} className={revealed ? 'animate-slide-up' : 'opacity-0'}>
 *
 * Why a custom hook (not a library):
 *   - Zero deps. The whole booking flow already feels heavy.
 *   - One IntersectionObserver per element is fine; React 18's
 *     useEffect cleanup handles teardown.
 *   - `once: true` (default) means we don't keep observing after
 *     the reveal — saves CPU on long pages.
 * ============================================================
 */

'use client'

import { useEffect, useRef, useState } from 'react'

export interface ScrollRevealOptions {
  /** 0..1 portion of element that must be visible before reveal. */
  threshold?: number
  /** Margin around root, e.g. '0px 0px -10% 0px' to fire earlier. */
  rootMargin?: string
  /** If true (default), unobserve after first reveal. */
  once?: boolean
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.15, rootMargin = '0px 0px -8% 0px', once = true } = options
  const ref = useRef<T | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // SSR-safe: `IntersectionObserver` is browser-only. If unavailable
    // (very old browsers, certain test environments) just reveal
    // immediately — better than animations that never fire.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setRevealed(false)
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, revealed }
}

export default useScrollReveal
