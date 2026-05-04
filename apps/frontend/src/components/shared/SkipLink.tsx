/**
 * ============================================================
 * SkipLink — keyboard accessibility helper
 * ============================================================
 *
 * Hidden until focused. The first Tab on any page lands here,
 * letting keyboard / screen-reader users jump past the navbar
 * straight into the main content. Required for WCAG 2.4.1.
 *
 * Pair with `<main id="main-content">` (or whatever id you put
 * in the href).
 * ============================================================
 */

'use client'

interface SkipLinkProps {
  href?: string
}

export default function SkipLink({ href = '#main-content' }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-slate-900 focus:text-white focus:font-semibold focus:shadow-lg"
    >
      ข้ามไปยังเนื้อหาหลัก / Skip to main content
    </a>
  )
}
