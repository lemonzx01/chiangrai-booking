/**
 * ============================================================
 * Admin Coupons Page — List + Create + Edit + Delete
 * ============================================================
 */

import AdminSidebar from '@/components/admin/Sidebar'
import { adminBackendJson } from '@/lib/admin-fetch'
import CouponsManager from './CouponsManager'

export const metadata = { title: 'จัดการคูปอง | Admin' }
export const dynamic = 'force-dynamic'

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'PERCENT' | 'FIXED'
  discount_value: number
  min_spend: number
  max_discount: number | null
  applies_to: 'ALL' | 'HOTEL' | 'CAR'
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

async function getCoupons(): Promise<Coupon[]> {
  try {
    const data = await adminBackendJson<{ coupons: Coupon[] }>(
      '/api/admin/coupons?limit=200'
    )
    return data.coupons || []
  } catch {
    return []
  }
}

export default async function AdminCouponsPage() {
  const coupons = await getCoupons()

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            จัดการคูปอง
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            สร้างและจัดการคูปองส่วนลดสำหรับลูกค้า
          </p>
        </div>

        <CouponsManager initialCoupons={coupons} />
      </main>
    </div>
  )
}
