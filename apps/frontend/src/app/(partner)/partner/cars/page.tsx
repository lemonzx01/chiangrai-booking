import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cookies } from 'next/headers'

import { getBackendUrl } from '@/lib/api'
import PartnerSidebar from '@/components/partner/Sidebar'
import { Car } from '@chiangrai/shared/types'

import PartnerCarsTable from './PartnerCarsTable'

export const metadata = {
  title: 'Cars | Partner',
}

export const dynamic = 'force-dynamic'

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

async function getPartnerCars(): Promise<Car[]> {
  try {
    const res = await fetchPartnerApi('/api/cars?limit=1000')
    if (!res.ok) {
      return []
    }

    const json = (await res.json()) as { data?: Car[] }
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
  }
}

export default async function PartnerCarsPage() {
  const cars = await getPartnerCars()

  return (
    <div className="flex">
      <PartnerSidebar />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Cars</h1>
              <p className="text-sm text-slate-500 mt-1">Manage your car inventory and availability status.</p>
            </div>

            <Link
              href="/partner/cars/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus size={18} />
              Add Car
            </Link>
          </div>

          <PartnerCarsTable cars={cars} />
        </div>
      </main>
    </div>
  )
}
