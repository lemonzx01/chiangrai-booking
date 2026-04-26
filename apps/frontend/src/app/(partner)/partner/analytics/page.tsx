/**
 * ============================================================
 * Partner Analytics — server entry
 * ============================================================
 *
 * Loads /api/partner/stats with cookie forwarding so the
 * client component renders synchronously with real data.
 * Window defaults to 30 days (configurable from the client).
 * ============================================================
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PartnerSidebar from '@/components/partner/Sidebar'
import { getBackendUrl } from '@/lib/api'
import AnalyticsClient, { type StatsResponse } from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'สถิติ / Analytics | Partner',
}

async function loadStats(days = 30): Promise<StatsResponse | null> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${getBackendUrl()}/api/partner/stats?days=${days}`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  })
  if (res.status === 401) redirect('/login')
  if (!res.ok) return null
  return (await res.json()) as StatsResponse
}

export default async function PartnerAnalyticsPage() {
  const initial = await loadStats(30)
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PartnerSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              สถิติของคุณ
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ภาพรวมรายได้ การจอง และอัตราการเข้าพักในรอบที่ผ่านมา
            </p>
          </div>
          <AnalyticsClient initial={initial} />
        </div>
      </main>
    </div>
  )
}
