/**
 * ============================================================
 * Customer Email Preferences — /email-preferences
 * ============================================================
 *
 * Reached from the "ยกเลิกรับอีเมล" link in marketing email
 * footers. The link carries an HMAC-signed token (see
 * lib/unsubscribe.ts on the backend) so the page can know
 * the user's email without forcing login.
 *
 * Flow:
 *   1. Server fetches /api/email-preferences?token=... on
 *      page load and hands the result to the client component
 *   2. If token is invalid → friendly error page
 *   3. Otherwise → client component renders a toggle the user
 *      can flip. Persists via POST to the same endpoint.
 *
 * No analytics on this page — visiting an unsubscribe page
 * isn't an event we want to track or accidentally export
 * downstream.
 * ============================================================
 */

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getBackendUrl } from '@/lib/api'
import EmailPreferencesClient from './EmailPreferencesClient'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export const metadata = {
  title: 'การรับอีเมล / Email preferences',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function loadStatus(token: string) {
  try {
    const res = await fetch(
      `${getBackendUrl()}/api/email-preferences?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    return (await res.json()) as { email: string; unsubscribed: boolean }
  } catch {
    return null
  }
}

export default async function EmailPreferencesPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  const initial = token ? await loadStatus(token) : null

  return (
    <div className="min-h-screen pt-24 pb-16 bg-slate-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
        }
      >
        <EmailPreferencesClient
          token={token || ''}
          initialEmail={initial?.email || ''}
          initialUnsubscribed={initial?.unsubscribed || false}
          tokenInvalid={!!token && initial === null}
        />
      </Suspense>
    </div>
  )
}
