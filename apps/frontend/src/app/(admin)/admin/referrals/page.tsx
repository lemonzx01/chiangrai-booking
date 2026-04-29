/**
 * ============================================================
 * Admin Referrals Page — list, filter, void
 * ============================================================
 *
 * Server Component shell. Fetches the initial list (newest 100)
 * with admin cookies forwarded, then hands off to the
 * ReferralsManager client component for interactivity.
 *
 * Why fetch on the server: the list is gated by admin auth,
 * so we may as well render it server-side for fast first paint.
 * The client component still re-fetches when the admin changes
 * the filter, so the SSR snapshot is just the initial view.
 * ============================================================
 */

import AdminSidebar from '@/components/admin/Sidebar'
import { adminBackendJson } from '@/lib/admin-fetch'
import ReferralsManager from './ReferralsManager'

export const metadata = { title: 'รายการแนะนำเพื่อน | Admin' }
export const dynamic = 'force-dynamic'

export interface ReferralRow {
  id: string
  status: 'pending' | 'qualified' | 'rewarded' | 'voided'
  referral_code: string
  qualified_at: string | null
  rewarded_at: string | null
  referrer_coupon_code: string | null
  referee_coupon_code: string | null
  created_at: string
  // Supabase typed-join shape — can be a single row or an array
  // depending on the relationship name. We accept both.
  referrer:
    | { id: string; name: string | null; email: string }
    | { id: string; name: string | null; email: string }[]
    | null
  referee:
    | { id: string; name: string | null; email: string }
    | { id: string; name: string | null; email: string }[]
    | null
}

async function getReferrals(): Promise<ReferralRow[]> {
  try {
    const data = await adminBackendJson<{ referrals: ReferralRow[] }>(
      '/api/admin/referrals'
    )
    return data.referrals || []
  } catch {
    return []
  }
}

export default async function AdminReferralsPage() {
  const referrals = await getReferrals()

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            รายการแนะนำเพื่อน
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ดูสถานะการแนะนำเพื่อน — ผ่านเงื่อนไข, ออกคูปองแล้ว, หรือยกเลิก
            (กรณีตรวจพบการโกง)
          </p>
        </div>

        <ReferralsManager initialReferrals={referrals} />
      </main>
    </div>
  )
}
