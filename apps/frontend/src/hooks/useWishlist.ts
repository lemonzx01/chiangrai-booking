/**
 * ============================================================
 * useWishlist — customer-saved listings
 * ============================================================
 *
 * Distinct from useRecentlyViewed:
 *   - Recently viewed = automatic, unbounded-by-intent (the
 *     page just records that you opened it). Capped at 12.
 *   - Wishlist = explicit "save this" action. No cap (within
 *     reason). User curates it.
 *
 * Storage shape (versioned key for forward-compat):
 *
 *   localStorage['wishlist_v1'] = JSON [
 *     { kind: 'hotel'|'car', id: string, addedAt: number }
 *   ]
 *
 * SSR safety: every method early-returns when window is
 * undefined. Hook can be called from server components but
 * the actual mutation must happen in a browser context.
 *
 * No backend persistence yet. When we add it, this hook stays
 * the same — we'll just sync localStorage ↔ /api/user/wishlist
 * when the user is logged in. Until then, "guest wishlist" is
 * lighter to ship and skips an auth-gate that would otherwise
 * scare off first-time visitors.
 * ============================================================
 */

'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'wishlist_v1'
const MAX_ITEMS = 100 // Generous; mostly to bound storage size

export type WishKind = 'hotel' | 'car'
export interface WishlistEntry {
  kind: WishKind
  id: string
  addedAt: number
}

function readStorage(): WishlistEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is WishlistEntry =>
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

function writeStorage(entries: WishlistEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    // Notify other tabs / hook instances on this page that the
    // wishlist changed. The native 'storage' event only fires
    // across tabs, not on the writing tab itself, so we add a
    // custom event for in-page propagation.
    window.dispatchEvent(new CustomEvent('wishlist:changed'))
  } catch {
    // Quota exceeded / private mode — silently drop.
  }
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistEntry[]>([])

  // Hydrate on mount + listen for cross-tab + in-page changes
  useEffect(() => {
    setItems(readStorage())
    const refresh = () => setItems(readStorage())
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('wishlist:changed', refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('wishlist:changed', refresh)
    }
  }, [])

  const add = useCallback((kind: WishKind, id: string) => {
    if (!id) return
    setItems((prev) => {
      // Idempotent — if already in list, leave alone (don't
      // bump addedAt, the order should be stable while user
      // browses).
      if (prev.some((e) => e.kind === kind && e.id === id)) return prev
      const next = [{ kind, id, addedAt: Date.now() }, ...prev].slice(0, MAX_ITEMS)
      writeStorage(next)
      return next
    })
  }, [])

  const remove = useCallback((kind: WishKind, id: string) => {
    setItems((prev) => {
      const next = prev.filter((e) => !(e.kind === kind && e.id === id))
      if (next.length === prev.length) return prev
      writeStorage(next)
      return next
    })
  }, [])

  const toggle = useCallback((kind: WishKind, id: string) => {
    setItems((prev) => {
      const exists = prev.some((e) => e.kind === kind && e.id === id)
      const next = exists
        ? prev.filter((e) => !(e.kind === kind && e.id === id))
        : [{ kind, id, addedAt: Date.now() }, ...prev].slice(0, MAX_ITEMS)
      writeStorage(next)
      return next
    })
  }, [])

  const has = useCallback(
    (kind: WishKind, id: string) => items.some((e) => e.kind === kind && e.id === id),
    [items]
  )

  const clear = useCallback(() => {
    setItems([])
    writeStorage([])
  }, [])

  return { items, add, remove, toggle, has, clear }
}

export default useWishlist
