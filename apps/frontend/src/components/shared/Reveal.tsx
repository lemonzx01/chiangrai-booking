/**
 * ============================================================
 * Reveal — declarative scroll-reveal wrapper
 * ============================================================
 *
 * Wraps any block of content; it stays visually hidden until
 * it scrolls into the viewport, then animates in.
 *
 * Respects prefers-reduced-motion: returns the children with
 * no animation classes when the user has motion disabled.
 *
 * Variants:
 *   - 'slide-up' (default): translate from y+20 → 0 + fade
 *   - 'fade':              fade only
 *   - 'scale-up':          slight zoom + fade
 *
 * Stagger:
 *   pass `delay={n * 80}` per item to cascade reveals.
 * ============================================================
 */

'use client'

import { type ReactNode } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

type RevealVariant = 'slide-up' | 'fade' | 'scale-up'

interface RevealProps {
  children: ReactNode
  variant?: RevealVariant
  /** Delay in ms before starting animation (for stagger). */
  delay?: number
  className?: string
  /** Override the threshold for triggering the reveal. */
  threshold?: number
  /** If true, animation re-runs every time the element scrolls in/out. */
  repeat?: boolean
}

const variantClass: Record<RevealVariant, { hidden: string; shown: string }> = {
  'slide-up': {
    hidden: 'opacity-0 translate-y-5',
    shown: 'opacity-100 translate-y-0',
  },
  fade: {
    hidden: 'opacity-0',
    shown: 'opacity-100',
  },
  'scale-up': {
    hidden: 'opacity-0 scale-95',
    shown: 'opacity-100 scale-100',
  },
}

export default function Reveal({
  children,
  variant = 'slide-up',
  delay = 0,
  className = '',
  threshold = 0.15,
  repeat = false,
}: RevealProps) {
  const reduced = usePrefersReducedMotion()
  const { ref, revealed } = useScrollReveal<HTMLDivElement>({
    threshold,
    once: !repeat,
  })

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  const v = variantClass[variant]
  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-all duration-700 ease-out ${
        revealed ? v.shown : v.hidden
      } ${className}`}
    >
      {children}
    </div>
  )
}
