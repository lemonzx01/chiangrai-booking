/**
 * ============================================================
 * useCurrentUser — fetch the logged-in customer (or null)
 * ============================================================
 *
 * Wraps GET /api/auth/me. Used to:
 *   - Auto-fill the booking form (name, email, phone)
 *   - Toggle "log in to see your bookings" hints
 *   - Decide whether to show the profile dropdown vs. log-in button
 *
 * Distinct from useAuth (admin-only) — this hook hits the
 * customer endpoint and returns the customer's profile data.
 *
 * Returns:
 *   - user:    object or null
 *   - loading: true while the first request is in flight
 *
 * SSR-safe: returns { user: null, loading: true } on the server.
 * ============================================================
 */

'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export interface CurrentUser {
  id: string
  email: string
  name?: string
  phone?: string | null
  email_verified?: boolean
  role?: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await apiFetch('/api/auth/me', { credentials: 'include' })
        if (!cancelled) {
          if (res.ok) {
            const json = (await res.json()) as { user?: CurrentUser }
            setUser(json.user || null)
          } else {
            setUser(null)
          }
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { user, loading }
}

export default useCurrentUser
