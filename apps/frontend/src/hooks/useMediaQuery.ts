/**
 * ============================================================
 * useMediaQuery — reactive matchMedia hook
 * ============================================================
 *
 * Returns true when the given CSS media query matches. Used by:
 *   - Bottom sheet vs modal switch on filter UIs (matches '(max-width: 640px)')
 *   - Reduced-motion check before firing entrance animations
 *
 * SSR returns `false` consistently to avoid hydration mismatch;
 * the real value lights up on the first effect tick.
 * ============================================================
 */

'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    // Older Safari uses addListener; modern browsers use addEventListener.
    if (mql.addEventListener) {
      mql.addEventListener('change', update)
      return () => mql.removeEventListener('change', update)
    }
    mql.addListener(update)
    return () => mql.removeListener(update)
  }, [query])

  return matches
}

/** Convenience: prefers-reduced-motion check used to gate entrance animations. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** Convenience: small viewport check (≤ 640px is Tailwind's `sm` breakpoint). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 640px)')
}

export default useMediaQuery
