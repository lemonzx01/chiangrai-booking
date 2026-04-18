/**
 * ============================================================
 * Admin — Create Manual Booking (Server Component)
 * ============================================================
 *
 * Page for admins to log a booking that was paid off-platform
 * (cash, bank transfer, LINE Pay, etc.). Posts to the backend
 * /api/admin/bookings endpoint which:
 *   - bypasses Stripe
 *   - inserts a payments row with status=SUCCEEDED (if paid=true)
 *   - still respects availability blocks & room/car capacity
 *     unless force=true is explicitly passed
 *
 * Fetches the resource list (hotels, cars, room_types) from
 * /api/partner/resources which returns everything when the caller
 * is admin. Cookies are forwarded server-side since this runs on
 * the frontend Next server (unauth redirect to /admin/login).
 * ============================================================
 */
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/Sidebar'
import { getBackendUrl } from '@/lib/api'
import NewBookingForm, { type ResourcesPayload } from './NewBookingForm'

export const metadata = {
  title: 'เพิ่มการจอง (Manual) | Admin',
}

async function loadResources(): Promise<ResourcesPayload> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')

  const res = await fetch(`${getBackendUrl()}/api/partner/resources`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  })

  if (res.status === 401) {
    redirect('/admin/login')
  }

  if (!res.ok) {
    throw new Error('ไม่สามารถโหลดข้อมูลโรงแรม/รถได้')
  }

  return (await res.json()) as ResourcesPayload
}

export default async function AdminNewBookingPage() {
  const resources = await loadResources()

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              เพิ่มการจองแบบ Manual
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ใช้เมื่อรับจองผ่านช่องทางนอกระบบ (เงินสด, โอนธนาคาร, LINE Pay ฯลฯ)
              ข้อมูลจะถูกบันทึกและบล็อกคิวอัตโนมัติ
            </p>
          </div>

          <NewBookingForm resources={resources} />
        </div>
      </main>
    </div>
  )
}
