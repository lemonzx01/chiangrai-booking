/**
 * ============================================================
 * Customer Booking Detail Page — /bookings/[code]
 * ============================================================
 *
 * The "all in one place" view for a booking after the customer
 * leaves the success page. Replaces the awkward flow where the
 * only way to revisit a booking was via /profile (login required)
 * or /success?code=…&email=… (success-page styling that doesn't
 * fit a follow-up visit).
 *
 * Lookup model:
 *   - URL is /bookings/<booking_code>
 *   - If user is logged in → backend matches by email automatically
 *   - Else: ?email=… in the query string is the auth hint;
 *     backend rejects mismatches with 403
 *   - Else: show a lookup form that asks for the email
 *
 * The backend endpoint /api/bookings/[code] already enforces
 * this — see apps/backend/src/app/api/bookings/[code]/route.ts.
 * ============================================================
 */

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import BookingDetailClient from './BookingDetailClient'

interface PageProps {
  params: Promise<{ code: string }>
  searchParams: Promise<{ email?: string }>
}

export const metadata = {
  title: 'การจองของฉัน',
  description: 'ดูรายละเอียดและจัดการการจอง',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function BookingDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { code } = await params
  const { email } = await searchParams

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin" size={28} />
          </div>
        }
      >
        <BookingDetailClient code={code} initialEmail={email || ''} />
      </Suspense>
    </div>
  )
}
