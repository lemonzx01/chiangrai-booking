/**
 * ============================================================
 * Admin Reviews Moderation Page
 * ============================================================
 */

import AdminSidebar from '@/components/admin/Sidebar'
import { adminBackendJson } from '@/lib/admin-fetch'
import ReviewsModerator from './ReviewsModerator'

export const metadata = { title: 'ตรวจสอบรีวิว | Admin' }
export const dynamic = 'force-dynamic'

export interface AdminReview {
  id: string
  hotel_id: string | null
  car_id: string | null
  customer_name: string
  customer_email: string
  rating: number
  comment: string | null
  is_approved: boolean
  moderated_at: string | null
  moderated_by: string | null
  rejection_reason: string | null
  created_at: string
  /** 0..100 spam score from heuristics (lib/spam.ts). Pending
   * queue is sorted spam_score DESC so the worst offenders
   * surface first. */
  spam_score?: number
  /** Short codes like 'many_links', 'all_caps' explaining why
   * the heuristic flagged it. Shown as chips in the admin UI. */
  spam_reasons?: string[]
  hotel?: { id: string; name_th: string; name_en: string } | null
  car?: { id: string; name_th: string; name_en: string } | null
}

interface ReviewsResponse {
  reviews: AdminReview[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
  summary: { pending: number; approved: number }
}

async function getPendingReviews(): Promise<ReviewsResponse> {
  try {
    return await adminBackendJson<ReviewsResponse>(
      '/api/admin/reviews?status=pending&limit=100'
    )
  } catch {
    return {
      reviews: [],
      pagination: { total: 0, limit: 100, offset: 0, hasMore: false },
      summary: { pending: 0, approved: 0 },
    }
  }
}

export default async function AdminReviewsPage() {
  const initial = await getPendingReviews()

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            ตรวจสอบรีวิว
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            อนุมัติหรือปฏิเสธรีวิวก่อนแสดงให้ลูกค้าเห็น
          </p>
        </div>

        <ReviewsModerator initial={initial} />
      </main>
    </div>
  )
}
