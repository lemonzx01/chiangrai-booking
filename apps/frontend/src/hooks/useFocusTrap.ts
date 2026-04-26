/**
 * ============================================================
 * useFocusTrap — keep keyboard focus inside a modal/dialog
 * ============================================================
 *
 * Why: WCAG 2.4.3 requires focus to stay within an open dialog
 * so screen-reader and keyboard users can't accidentally tab
 * back to the page underneath. This hook:
 *
 *   1. On mount: stash the previously-focused element, focus the
 *      first focusable inside the container (or the container
 *      itself if none).
 *   2. On Tab/Shift+Tab: wrap focus around the first/last element
 *      inside.
 *   3. On unmount: restore focus to wherever it came from so the
 *      user lands back on the trigger button.
 *
 * Pass `enabled = false` to skip — useful for conditionally
 * mounted dialogs (e.g. only when `open === true`).
 * ============================================================
 */

'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(enabled = true) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!enabled) return
    const container = ref.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Try to focus the first focusable element; fall back to container.
    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (focusables.length > 0) {
      focusables[0].focus()
    } else {
      container.tabIndex = -1
      container.focus()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const list = container.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (list.length === 0) {
        e.preventDefault()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // Restore focus to the trigger if it's still in the DOM.
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    }
  }, [enabled])

  return ref
}

export default useFocusTrap
