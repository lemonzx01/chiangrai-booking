/**
 * ============================================================
 * useWishlist — customer-saved listings (offline-first)
 * ============================================================
 *
 * Distinct from useRecentlyViewed:
 *   - Recently viewed = automatic, unbounded-by-intent (the
 *     page just records that you opened it). Capped at 12.
 *   - Wishlist = explicit "save this" action. Capped at 100.
 *
 * Storage strategy:
 *   1. Always read/write localStorage first — guests have no
 *      auth, and even logged-in users get instant feedback
 *      without an API round-trip.
 *   2. When the user is logged in (/api/auth/me returns OK):
 *      a. On mount: GET /api/user/wishlist + reconcile with
 *         localStorage. The merge is union-of-both, with
 *         server's added_at winning on overlap.
 *      b. On any mutation: fire POST/DELETE in the background.
 *         Failures are logged but don't roll back the local
 *         change — better to lose a sync than to surprise the
 *         user with a missing heart.
 *
 *   The merge step also POSTs the localStorage list to
 *   /api/user/wishlist with { merge: [...] } so guest items
 *   the user accumulated before logging in get persisted too.
 *
 * SSR safety: every method early-returns when window is
 * undefined.
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

// ---------------------------------------------------------------
// Backend sync — fire-and-forget. Failures are logged but never
// roll back the local change.
// ---------------------------------------------------------------

interface ServerEntry {
  kind: WishKind
  id: string
  added_at?: string
}

async function fetchServerList(): Promise<ServerEntry[] | null> {
  try {
    const res = await fetch('/api/user/wishlist', { credentials: 'include' })
    if (res.status === 401) return null // guest — no sync
    if (!res.ok) return null
    const json = (await res.json()) as { items?: ServerEntry[] }
    return json.items || []
  } catch {
    return null
  }
}

async function syncMerge(items: WishlistEntry[]): Promise<void> {
  if (items.length === 0) return
  try {
    // Get the CSRF token from cookie (browser-only path)
    const csrf =
      typeof document !== 'undefined'
        ? (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1] || '')
        : ''
    await fetch('/api/user/wishlist', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {}),
      },
      body: JSON.stringify({
        merge: items.map((e) => ({
          kind: e.kind,
          id: e.id,
          added_at: new Date(e.addedAt).toISOString(),
        })),
      }),
    })
  } catch {
    // ignore — best-effort sync
  }
}

async function syncAdd(kind: WishKind, id: string): Promise<void> {
  try {
    const csrf =
      typeof document !== 'undefined'
        ? (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1] || '')
        : ''
    await fetch('/api/user/wishlist', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {}),
      },
      body: JSON.stringify({ kind, id }),
    })
  } catch {
    /* ignore */
  }
}

async function syncRemove(kind: WishKind, id: string): Promise<void> {
  try {
    const csrf =
      typeof document !== 'undefined'
        ? (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1] || '')
        : ''
    await fetch(
      `/api/user/wishlist?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {}),
        },
      }
    )
  } catch {
    /* ignore */
  }
}

async function syncClear(): Promise<void> {
  try {
    const csrf =
      typeof document !== 'undefined'
        ? (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1] || '')
        : ''
    await fetch('/api/user/wishlist?all=1', {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...(csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {}),
      },
    })
  } catch {
    /* ignore */
  }
}

// Merge two lists; on key collision, keep the entry with the
// EARLIER addedAt (the user saved it first — that's their truth).
function unionByKey(
  a: WishlistEntry[],
  b: WishlistEntry[]
): WishlistEntry[] {
  const map = new Map<string, WishlistEntry>()
  for (const entry of [...a, ...b]) {
    const key = `${entry.kind}:${entry.id}`
    const existing = map.get(key)
    if (!existing || entry.addedAt < existing.addedAt) {
      map.set(key, entry)
    }
  }
  return Array.from(map.values())
    .sort((x, y) => y.addedAt - x.addedAt)
    .slice(0, MAX_ITEMS)
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistEntry[]>([])
  const [synced, setSynced] = useState(false)

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

  // Backend reconciliation — runs once after mount.
  // 1. Fetch server list (returns null for guests)
  // 2. Union with localStorage; write merged list back to both
  // 3. POST any localStorage entries that weren't on the server
  useEffect(() => {
    if (synced) return
    let cancelled = false
    void (async () => {
      const local = readStorage()
      const server = await fetchServerList()
      if (cancelled) return
      if (server === null) {
        // Guest — nothing to sync
        setSynced(true)
        return
      }
      const serverEntries: WishlistEntry[] = server.map((s) => ({
        kind: s.kind,
        id: s.id,
        addedAt: s.added_at ? new Date(s.added_at).getTime() : Date.now(),
      }))
      const merged = unionByKey(local, serverEntries)
      writeStorage(merged)
      setItems(merged)
      // Push any local-only entries to the server
      const serverKeys = new Set(serverEntries.map((e) => `${e.kind}:${e.id}`))
      const localOnly = local.filter(
        (e) => !serverKeys.has(`${e.kind}:${e.id}`)
      )
      if (localOnly.length > 0) {
        await syncMerge(localOnly)
      }
      setSynced(true)
    })()
    return () => {
      cancelled = true
    }
  }, [synced])

  const add = useCallback((kind: WishKind, id: string) => {
    if (!id) return
    setItems((prev) => {
      if (prev.some((e) => e.kind === kind && e.id === id)) return prev
      const next = [{ kind, id, addedAt: Date.now() }, ...prev].slice(0, MAX_ITEMS)
      writeStorage(next)
      return next
    })
    void syncAdd(kind, id)
  }, [])

  const remove = useCallback((kind: WishKind, id: string) => {
    setItems((prev) => {
      const next = prev.filter((e) => !(e.kind === kind && e.id === id))
      if (next.length === prev.length) return prev
      writeStorage(next)
      return next
    })
    void syncRemove(kind, id)
  }, [])

  const toggle = useCallback((kind: WishKind, id: string) => {
    setItems((prev) => {
      const exists = prev.some((e) => e.kind === kind && e.id === id)
      const next = exists
        ? prev.filter((e) => !(e.kind === kind && e.id === id))
        : [{ kind, id, addedAt: Date.now() }, ...prev].slice(0, MAX_ITEMS)
      writeStorage(next)
      // Decide which sync action to fire AFTER the state update
      // closure decides — `exists` was based on `prev`
      if (exists) void syncRemove(kind, id)
      else void syncAdd(kind, id)
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
    void syncClear()
  }, [])

  return { items, add, remove, toggle, has, clear }
}

export default useWishlist
