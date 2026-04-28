/**
 * ============================================================
 * Admin Email Campaigns — server entry
 * ============================================================
 *
 * Loads the past campaign list with cookie forwarding so the
 * client renders synchronously. The composer state is fully
 * client-side; we don't pre-fetch cohort recipient counts here.
 * ============================================================
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import { getBackendUrl } from '@/lib/api'
import CampaignsClient, { type CampaignRow } from './CampaignsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'แคมเปญอีเมล | Admin',
}

async function loadCampaigns(): Promise<CampaignRow[]> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')
  const res = await fetch(`${getBackendUrl()}/api/admin/campaigns?limit=50`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  })
  if (res.status === 401) redirect('/admin/login')
  if (!res.ok) return []
  const json = (await res.json()) as { data?: CampaignRow[] }
  return json.data || []
}

export default async function AdminCampaignsPage() {
  const initial = await loadCampaigns()
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              แคมเปญอีเมล
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ส่งโปรโมชันถึงลูกค้าที่กรองตามเกณฑ์ — รองรับสูงสุด 1,000 ผู้รับต่อรอบ
            </p>
          </div>
          <CampaignsClient initialCampaigns={initial} />
        </div>
      </main>
    </div>
  )
}
