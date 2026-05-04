'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Review } from '@chiangrai/shared/types'
import { Star, MessageSquare } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { apiFetch } from '@/lib/api'

interface ReviewsSectionProps {
  hotelId?: string
  carId?: string
}

interface ReviewResponse {
  data: Review[]
  total: number
  average_rating: number
}

function StarRow({
  rating,
  onSelect,
}: {
  rating: number
  onSelect?: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect?.(value)}
          className={onSelect ? 'transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star
            size={18}
            className={value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewsSection({ hotelId, carId }: ReviewsSectionProps) {
  const { i18n } = useTranslation()
  const isThai = i18n.language !== 'en'

  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    rating: 5,
    comment: '',
  })

  useEffect(() => {
    async function fetchReviews() {
      const params = new URLSearchParams()
      if (hotelId) params.set('hotel_id', hotelId)
      if (carId) params.set('car_id', carId)

      if (!params.toString()) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/reviews?${params.toString()}`)
        const data = (await response.json()) as ReviewResponse

        if (!response.ok) {
          setLoadError(isThai ? 'ไม่สามารถโหลดรีวิวได้' : 'Unable to load reviews')
          return
        }

        setReviews(data.data || [])
        setTotal(data.total || 0)
        setAverageRating(data.average_rating || 0)
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
        setLoadError(isThai ? 'ไม่สามารถโหลดรีวิวได้' : 'Unable to load reviews')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [carId, hotelId, isThai])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')

    try {
      const response = await apiFetch('/api/reviews', {
        method: 'POST',
        body: {
          hotel_id: hotelId,
          car_id: carId,
          ...formData,
          comment: formData.comment.trim() || null,
        },
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          data?.error?.message ||
          data?.error ||
          (isThai ? 'ส่งรีวิวไม่สำเร็จ' : 'Unable to submit review')
        setSubmitError(message)
        return
      }

      // Reviews require admin moderation, so do NOT add to the visible list.
      // The backend responds with a message explaining the review is pending.
      setFormData({
        customer_name: '',
        customer_email: '',
        rating: 5,
        comment: '',
      })
      setSubmitSuccess(
        data?.message ||
          (isThai
            ? 'ส่งรีวิวเรียบร้อยแล้ว รอการตรวจสอบก่อนเผยแพร่'
            : 'Review submitted — pending moderation before it appears')
      )
    } catch (error) {
      console.error('Failed to submit review:', error)
      setSubmitError(isThai ? 'ส่งรีวิวไม่สำเร็จ' : 'Unable to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-10 sm:mt-14">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <MessageSquare size={14} />
                {isThai ? 'รีวิวจากลูกค้า' : 'Guest reviews'}
              </div>
              <h2 className="mt-3 text-xl font-black text-slate-900">
                {isThai ? 'ความคิดเห็นล่าสุด' : 'Latest reviews'}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-slate-900">{averageRating.toFixed(1)}</p>
              <div className="mt-1 flex justify-end">
                <StarRow rating={Math.round(averageRating)} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {total} {isThai ? 'รีวิว' : 'reviews'}
              </p>
            </div>
          </div>

          {loading && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
              {isThai ? 'กำลังโหลดรีวิว...' : 'Loading reviews...'}
            </div>
          )}

          {loadError && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-600">
              {loadError}
            </div>
          )}

          {!loading && !loadError && reviews.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-base font-semibold text-slate-700">
                {isThai ? 'ยังไม่มีรีวิว' : 'No reviews yet'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {isThai ? 'เป็นคนแรกที่แชร์ประสบการณ์การใช้งาน' : 'Be the first to share your experience'}
              </p>
            </div>
          )}

          {!loading && !loadError && reviews.length > 0 && (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{review.customer_name}</p>
                      <div className="mt-1">
                        <StarRow rating={review.rating} />
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">
                      {new Date(review.created_at).toLocaleDateString(
                        isThai ? 'th-TH' : 'en-US',
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </p>
                  </div>

                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 sm:p-6">
          <h3 className="text-xl font-black text-slate-900">
            {isThai ? 'เขียนรีวิว' : 'Write a review'}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {isThai ? 'ช่วยให้ลูกค้าคนถัดไปตัดสินใจได้ง่ายขึ้น' : 'Help the next customer decide faster'}
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <Input
              label={isThai ? 'ชื่อ' : 'Name'}
              value={formData.customer_name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, customer_name: event.target.value }))
              }
              required
            />
            <Input
              type="email"
              label={isThai ? 'อีเมล' : 'Email'}
              value={formData.customer_email}
              onChange={(event) =>
                setFormData((current) => ({ ...current, customer_email: event.target.value }))
              }
              required
            />

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                {isThai ? 'คะแนน' : 'Rating'}
              </label>
              <StarRow
                rating={formData.rating}
                onSelect={(value) => setFormData((current) => ({ ...current, rating: value }))}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                {isThai ? 'ความคิดเห็นเพิ่มเติม' : 'Comment'}
              </label>
              <textarea
                value={formData.comment}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, comment: event.target.value }))
                }
                rows={5}
                placeholder={
                  isThai
                    ? 'เล่าประสบการณ์ของคุณ เช่น การบริการ ความสะอาด หรือความคุ้มค่า'
                    : 'Share your experience, service quality, cleanliness, or value'
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 outline-none transition-colors"
              />
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {submitSuccess}
              </div>
            )}

            <Button type="submit" className="w-full" loading={submitting}>
              {isThai ? 'ส่งรีวิว' : 'Submit review'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
