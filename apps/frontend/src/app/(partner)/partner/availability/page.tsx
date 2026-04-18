/**
 * Partner Availability Calendar
 *
 * Server component: forwards partner cookies to the backend
 * /api/partner/resources call, then hands the list of hotels/cars
 * off to the client component for rendering + mutation.
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getBackendUrl } from '@/lib/api'
import PartnerSidebar from '@/components/partner/Sidebar'

import AvailabilityClient from './AvailabilityClient'

export const metadata = {
  title: 'Availability Calendar | Partner',
}

export const dynamic = 'force-dynamic'

interface Resources {
  hotels: Array<{ id: string; name_th: string; name_en: string | null }>
  cars: Array<{ id: string; name_th: string; name_en: string | null }>
  room_types: Array<{ id: string; hotel_id: string; name_th: string; name_en: string | null }>
  is_admin: boolean
}

async function fetchResources(): Promise<Resources | null> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')

  const res = await fetch(`${getBackendUrl()}/api/partner/resources`, {
    cache: 'no-store',
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  }).catch(() => null)

  if (!res) return null
  if (res.status === 401) return null
  if (!res.ok) {
    return {
      hotels: [],
      cars: [],
      room_types: [],
      is_admin: false,
    }
  }
  return (await res.json()) as Resources
}

export default async function PartnerAvailabilityPage() {
  const resources = await fetchResources()
  if (!resources) {
    redirect('/login?redirect=/partner/availability')
  }

  return (
    <div className="flex">
      <PartnerSidebar />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">ปฏิทินความพร้อม</h1>
            <p className="text-sm text-slate-500 mt-1">
              บล็อกวันที่ที่คุณไม่พร้อมรับการจอง (ซ่อมบำรุง, งานส่วนตัว ฯลฯ) — ระบบจะปฏิเสธการจองที่ตรงกับวันที่บล็อก
              โดยอัตโนมัติ
            </p>
          </div>

          <AvailabilityClient initialResources={resources} />
        </div>
      </main>
    </div>
  )
}
