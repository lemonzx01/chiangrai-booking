/**
 * ============================================================
 * Admin Loyalty Page — top earners + manual adjust
 * ============================================================
 *
 * Server Component shell. Seeds the leaderboard from the API
 * with admin cookies forwarded, hands off to LoyaltyManager
 * for adjust modal interactivity.
 * ============================================================
 */

import AdminSidebar from '@/components/admin/Sidebar'
import { adminBackendJson } from '@/lib/admin-fetch'
import LoyaltyManager from './LoyaltyManager'

export const metadata = { title: 'Loyalty | Admin' }
export const dynamic = 'force-dynamic'

export interface LoyaltyUserRow {
  id: string
  name: string | null
  email: string
  balance: number
  lifetimeEarned: number
  tier: { level: 'bronze' | 'silver' | 'gold'; name: string; multiplier: number }
  createdAt: string
}

async function getUsers(): Promise<LoyaltyUserRow[]> {
  try {
    const data = await adminBackendJson<{ users: LoyaltyUserRow[] }>(
      '/api/admin/loyalty'
    )
    return data.users || []
  } catch {
    return []
  }
}

export default async function AdminLoyaltyPage() {
  const users = await getUsers()

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            แต้มสะสม
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ลำดับผู้ใช้ตามแต้มสะสมตลอดชีพ — กดที่บัญชีเพื่อปรับยอดด้วยตนเอง
          </p>
        </div>

        <LoyaltyManager initialUsers={users} />
      </main>
    </div>
  )
}
