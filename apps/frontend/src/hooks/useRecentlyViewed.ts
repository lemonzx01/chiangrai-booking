/**
 * ============================================================
 * useRecentlyViewed — localStorage-backed history of viewed
 * listings (hotels and cars), used to power the "Recently
 * Viewed" carousel on home and listing pages.
 * ============================================================
 *
 * Storage shape (versioned key so we can change shape later
 * without crashing existing browsers):
 *
 *   localStorage['recently_viewed_v1'] = JSON [
 *     { kind: 'hotel'|'car', id: string, viewedAt: number }
 *   ]
 *
 * - `track(kind, id)` adds/updates an entry, capped at 12 items.
 * - `items` returns the array sorted newest-first.
 * - `clear()` empties the list (used by a "clear history" button
 *   in the privacy/profile area).
 *
 * SSR safety: every method early-returns when `window` is
 * undefined — this hook is fine in server components that hand
 * it to a client subtree, but the actual call must come from a
 * browser context.
 * ============================================================
 */

'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'recently_viewed_v1'
const MAX_ITEMS = 12

export type ViewedKind = 'hotel' | 'car'
export interface ViewedEntry {
  kind: ViewedKind
  id: string
  viewedAt: number
}

function readStorage(): ViewedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    // Defensive: filter out anything that doesn't match the expected
    // shape — older versions of this code may have written different
    // structures that would crash downstream consumers.
    return parsed.filter(
      (e): e is ViewedEntry =>
        !!e &&
        typeof e === 'object' &&
        'kind' in e &&
        'id' in e &&
        (e.kind === 'hotel' || e.kind === 'car') &&
        typeof e.id === 'string'
    )
  } catch {
    return []
  }
}

function writeStorage(entries: ViewedEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Quota exceeded / private mode — silently drop. Worst case,
    // user just doesn't see "recently viewed" carousel populate.
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<ViewedEntry[]>([])

  // Hydrate from storage on mount. SSR returns [].
  useEffect(() => {
    setItems(readStorage())
  }, [])

  const track = useCallback((kind: ViewedKind, id: string) => {
    if (!id) return
    setItems((prev) => {
      const without = prev.filter((e) => !(e.kind === kind && e.id === id))
      const next = [{ kind, id, viewedAt: Date.now() }, ...without].slice(0, MAX_ITEMS)
      writeStorage(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    writeStorage([])
  }, [])

  return { items, track, clear }
}

export default useRecentlyViewed
