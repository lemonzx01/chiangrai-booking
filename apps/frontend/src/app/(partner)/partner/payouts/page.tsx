/**
 * ============================================================
 * Partner Payouts (Stripe Connect onboarding) — server entry
 * ============================================================
 *
 * Loads the partner's profile (which carries stripe_account_id
 * once onboarding has begun), then hands off to the client
 * component which handles status polling + onboarding link.
 *
 * Why a single page instead of separate "start" / "status":
 *   The user mental model is one screen — "where am I in
 *   getting paid?" — so we keep status, action button, and
 *   help text together.
 * ============================================================
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PartnerSidebar from '@/components/partner/Sidebar'
import { getBackendUrl } from '@/lib/api'
import PayoutsClient, { type PartnerProfile } from './PayoutsClient'

export const metadata = {
  title: 'การรับเงิน — Stripe Connect | Partner',
}

async function loadPartner(): Promise<PartnerProfile> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')

  const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  })
  if (res.status === 401) redirect('/login')
  if (!res.ok) throw new Error('โหลดข้อมูลพาร์ทเนอร์ไม่สำเร็จ')

  const json = (await res.json()) as { user?: { id?: string; email?: string; name?: string } }
  if (!json.user?.id) redirect('/login')

  // Pull the partner row (carries stripe_account_id + onboarding_status)
  const partnerRes = await fetch(`${getBackendUrl()}/api/partners/${json.user.id}`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  })

  if (partnerRes.ok) {
    const data = (await partnerRes.json()) as Partial<PartnerProfile>
    return {
      id: json.user.id,
      email: json.user.email || '',
      name: json.user.name || '',
      stripe_account_id: data.stripe_account_id || null,
      onboarding_status: data.onboarding_status || null,
    }
  }

  // Partner row may not exist yet (e.g. brand-new account) — that's fine.
  return {
    id: json.user.id,
    email: json.user.email || '',
    name: json.user.name || '',
    stripe_account_id: null,
    onboarding_status: null,
  }
}

export default async function PartnerPayoutsPage() {
  const partner = await loadPartner()
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PartnerSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">การรับเงิน</h1>
            <p className="text-sm text-slate-500 mt-1">
              เชื่อมบัญชี Stripe Connect เพื่อรับเงินจากการจองโดยตรง
            </p>
          </div>
          <PayoutsClient partner={partner} />
        </div>
      </main>
    </div>
  )
}
