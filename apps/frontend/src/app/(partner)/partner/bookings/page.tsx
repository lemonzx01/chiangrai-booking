import { cookies } from 'next/headers'

import { BookingStatus } from '@chiangrai/shared/types'

import { getBackendUrl } from '@/lib/api'
import PartnerSidebar from '@/components/partner/Sidebar'

import PartnerBookingsTable from './PartnerBookingsTable'

export const metadata = {
  title: 'Bookings | Partner',
}

export const dynamic = 'force-dynamic'

interface PartnerBookingRow {
  id: string
  booking_code: string
  customer_name: string
  customer_email: string
  customer_phone: string
  check_in_date: string
  check_out_date: string
  total_price: number
  status: BookingStatus
  hotel?: { name_th: string } | null
  car?: { name_th: string } | null
}

async function fetchPartnerApi(path: string) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (cookieHeader) {
    headers.Cookie = cookieHeader
  }

  return fetch(`${getBackendUrl()}${path}`, {
    cache: 'no-store',
    headers,
  })
}

async function getPartnerBookings(): Promise<PartnerBookingRow[]> {
  try {
    const response = await fetchPartnerApi('/api/bookings?limit=1000')
    if (!response.ok) {
      return []
    }

    const json = (await response.json()) as { data?: PartnerBookingRow[] }
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
  }
}

export default async function PartnerBookingsPage() {
  const bookings = await getPartnerBookings()

  return (
    <div className="flex">
      <PartnerSidebar />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Bookings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track all bookings that belong to your cars or hotels.
            </p>
          </div>

          <PartnerBookingsTable bookings={bookings} />
        </div>
      </main>
    </div>
  )
}
