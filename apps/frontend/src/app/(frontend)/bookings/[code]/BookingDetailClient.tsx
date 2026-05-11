/**
 * ============================================================
 * Customer Booking Detail Client
 * ============================================================
 *
 * Three rendered states:
 *   1. Lookup form — when neither logged-in nor ?email= present.
 *      Customer types the email used for booking, we re-fetch.
 *   2. Loading
 *   3. Detail view — status banner + booking details + actions
 *
 * Actions surface based on booking status:
 *   PENDING / CONFIRMED / PAID:
 *     - Reschedule request → admin inbox
 *     - Cancel → calls /api/bookings/[code]/cancel
 *     - Download invoice (PDF)
 *   CANCELLED / COMPLETED:
 *     - Download invoice only
 *
 * Trust signals + "what's next" copy keep customers oriented
 * the same way the success page does, but for return visits.
 * ============================================================
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
  Mail,
  Phone,
  CreditCard,
  Download,
  Building2,
  Car as CarIcon,
  XCircle,
  Clock,
  CalendarClock,
  ArrowLeft,
  Search,
  type LucideIcon,
} from 'lucide-react'

import { formatCurrency } from '@chiangrai/shared/utils'
import { useToast } from '@/components/shared/Toast'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import { apiFetch } from '@/lib/api'
import ModificationRequestModal from '@/components/shared/ModificationRequestModal'
import TrustSignals from '@/components/shared/TrustSignals'
import { BookingDetailSkeleton } from '@/components/shared/Skeletons'

// ---------------------------------------------------------------
// Types — narrow shape we actually render. Booking has many more
// fields server-side; only declare what we touch.
// ---------------------------------------------------------------

interface BookingDetail {
  id: string
  booking_code: string
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PAID'
    | 'CANCELLED'
    | 'COMPLETED'
    | string
  booking_type: 'HOTEL' | 'CAR' | 'COMBO' | string
  customer_name: string
  customer_email: string
  customer_phone: string
  check_in_date: string
  check_out_date: string
  number_of_guests: number
  total_price: number
  currency?: string
  special_requests?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  refund_amount?: number | null
  refund_status?: string | null
  hotel?: { name_th?: string; name_en?: string; location?: string } | null
  car?: { name_th?: string; name_en?: string; car_type_th?: string } | null
}

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------

export default function BookingDetailClient({
  code,
  initialEmail,
}: {
  code: string
  initialEmail: string
}) {
  const toast = useToast()
  const confirm = useConfirm()
  const [email, setEmail] = useState(initialEmail)
  const [emailDraft, setEmailDraft] = useState(initialEmail)
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsEmail, setNeedsEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReschedule, setShowReschedule] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(
    async (lookupEmail: string) => {
      setLoading(true)
      setError(null)
      try {
        const query = lookupEmail
          ? `?email=${encodeURIComponent(lookupEmail)}`
          : ''
        const res = await fetch(`/api/bookings/${code}${query}`, {
          credentials: 'include',
        })

        if (res.status === 401 || res.status === 403) {
          // Either we need an email hint or the email didn't match.
          // Short-circuit to the lookup form instead of guessing.
          setNeedsEmail(true)
          setBooking(null)
          return
        }
        if (res.status === 404) {
          setError('ไม่พบการจองนี้ — ตรวจสอบรหัสอีกครั้ง')
          setBooking(null)
          return
        }
        if (!res.ok) {
          throw new Error('โหลดข้อมูลไม่สำเร็จ')
        }
        const data = (await res.json()) as BookingDetail
        setBooking(data)
        setNeedsEmail(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
        setBooking(null)
      } finally {
        setLoading(false)
      }
    },
    [code]
  )

  useEffect(() => {
    void load(email)
  }, [email, load])

  // ---- Cancel flow ---------------------------------------------
  const handleCancel = async () => {
    if (!booking) return
    const ok = await confirm({
      title: 'ยกเลิกการจองนี้?',
      body: `รหัส ${booking.booking_code} — การยกเลิกจะคำนวณการคืนเงินตามนโยบาย (ก่อน 7 วัน 100%, 3-6 วัน 50%, น้อยกว่า 3 วัน 0%)`,
      confirmLabel: 'ยกเลิกการจอง',
      variant: 'danger',
    })
    if (!ok) return

    setCancelling(true)
    try {
      const res = await apiFetch(
        `/api/bookings/${booking.booking_code}/cancel`,
        {
          method: 'POST',
          body: { reason: 'ลูกค้ายกเลิกผ่านหน้า booking detail' },
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          (data as { error?: string }).error || 'ยกเลิกไม่สำเร็จ'
        )
        return
      }
      toast.success('ยกเลิกการจองเรียบร้อย')
      await load(email)
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setCancelling(false)
    }
  }

  // ---- Render branches -----------------------------------------

  if (loading) {
    return <BookingDetailSkeleton />
  }

  if (needsEmail) {
    return (
      <LookupForm
        code={code}
        emailDraft={emailDraft}
        setEmailDraft={setEmailDraft}
        onSubmit={() => setEmail(emailDraft.trim())}
      />
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl bg-white border border-slate-100 p-8 text-center">
          <AlertTriangle className="text-amber-500 mx-auto mb-3" size={32} />
          <p className="text-sm font-bold text-slate-900">
            {error || 'ไม่พบการจอง'}
          </p>
          <p className="text-xs text-slate-500 mt-2">รหัส: {code}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setNeedsEmail(true)}
              className="text-sm text-slate-900 font-semibold hover:underline"
            >
              ค้นหาด้วยอีเมล
            </button>
            <Link
              href="/contact"
              className="text-sm text-slate-500 hover:underline"
            >
              ติดต่อทีมงาน
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const itemName =
    booking.hotel?.name_th ||
    booking.hotel?.name_en ||
    booking.car?.name_th ||
    booking.car?.name_en ||
    'รายการ'

  const isActive = ['PENDING', 'CONFIRMED', 'PAID'].includes(booking.status)
  const invoiceQuery = email
    ? `?email=${encodeURIComponent(email)}`
    : ''

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft size={14} />
          กลับ
        </Link>

        {/* Status banner */}
        <StatusBanner booking={booking} />

        {/* Booking summary card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
          <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                {booking.booking_type === 'CAR' ? (
                  <CarIcon className="text-slate-900" size={20} />
                ) : (
                  <Building2 className="text-slate-900" size={20} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  {booking.booking_type}
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {itemName}
                </h1>
                {booking.hotel?.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin size={12} />
                    <span>{booking.hotel.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-3 text-sm">
            <Row
              icon={Calendar}
              label="วันเข้า → ออก"
              value={`${formatDate(booking.check_in_date)} → ${formatDate(booking.check_out_date)}`}
            />
            <Row
              icon={Users}
              label="จำนวนผู้เข้าพัก"
              value={`${booking.number_of_guests} คน`}
            />
            <Row icon={Mail} label="อีเมล" value={booking.customer_email} />
            <Row icon={Phone} label="เบอร์โทร" value={booking.customer_phone} />
            {booking.special_requests && (
              <Row
                icon={Clock}
                label="คำขอพิเศษ"
                value={booking.special_requests}
              />
            )}
          </div>

          {/* Total */}
          <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CreditCard size={16} />
              ยอดรวม
            </div>
            <div className="text-xl sm:text-2xl font-display font-medium text-slate-900 tracking-tight">
              {formatCurrency(booking.total_price)}
            </div>
          </div>

          {/* Refund line if cancelled */}
          {booking.status === 'CANCELLED' && (booking.refund_amount || 0) > 0 && (
            <div className="px-5 sm:px-6 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-sm">
              <span className="text-emerald-800 font-medium">
                คืนเงินแล้ว ({booking.refund_status})
              </span>
              <span className="font-bold text-emerald-700">
                {formatCurrency(booking.refund_amount || 0)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {isActive && (
            <>
              <button
                type="button"
                onClick={() => setShowReschedule(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50 hover:border-slate-300"
              >
                <CalendarClock size={16} />
                ขอเลื่อนวัน
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {cancelling ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                ยกเลิกการจอง
              </button>
            </>
          )}
          <a
            href={`/api/bookings/${booking.booking_code}/invoice${invoiceQuery}`}
            target="_blank"
            rel="noopener"
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 ${
              isActive ? '' : 'sm:col-span-2'
            }`}
          >
            <Download size={16} />
            ดาวน์โหลดใบเสร็จ (PDF)
          </a>
        </div>

        {/* What next */}
        {isActive && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 mt-4">
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              สิ่งที่จะเกิดขึ้นต่อไป
            </h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2
                  size={14}
                  className="text-emerald-500 mt-0.5 flex-shrink-0"
                />
                <span>เก็บอีเมลยืนยันไว้แสดงตอนเช็คอิน</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  size={14}
                  className="text-emerald-500 mt-0.5 flex-shrink-0"
                />
                <span>ทีมงานจะติดต่อ 24 ชม. ก่อนถึงวันเช็คอิน</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  size={14}
                  className="text-emerald-500 mt-0.5 flex-shrink-0"
                />
                <span>
                  เปลี่ยนแปลงได้ทาง LINE หรือกดปุ่ม &ldquo;ขอเลื่อนวัน&rdquo; ด้านบน
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* Trust signals */}
        <div className="mt-6">
          <TrustSignals variant="compact" />
        </div>
      </div>

      {/* Reschedule modal */}
      {showReschedule && (
        <ModificationRequestModal
          open
          bookingCode={booking.booking_code}
          currentCheckIn={booking.check_in_date}
          currentCheckOut={booking.check_out_date}
          onClose={() => setShowReschedule(false)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------

function StatusBanner({ booking }: { booking: BookingDetail }) {
  const cfg = (() => {
    switch (booking.status) {
      case 'PAID':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'ชำระเงินเรียบร้อย',
          color: 'text-emerald-800',
          desc: 'การจองของคุณยืนยันแล้ว',
        }
      case 'CONFIRMED':
        return {
          icon: CheckCircle2,
          bg: 'bg-blue-50 border-blue-200',
          dot: 'bg-blue-500',
          label: 'ยืนยันแล้ว',
          color: 'text-blue-800',
          desc: 'รอการชำระเงิน',
        }
      case 'PENDING':
        return {
          icon: Clock,
          bg: 'bg-amber-50 border-amber-200',
          dot: 'bg-amber-500',
          label: 'รอดำเนินการ',
          color: 'text-amber-800',
          desc: 'กำลังประมวลผล...',
        }
      case 'CANCELLED':
        return {
          icon: XCircle,
          bg: 'bg-red-50 border-red-200',
          dot: 'bg-red-500',
          label: 'ยกเลิกแล้ว',
          color: 'text-red-800',
          desc: booking.cancellation_reason || '',
        }
      case 'COMPLETED':
        return {
          icon: CheckCircle2,
          bg: 'bg-slate-50 border-slate-200',
          dot: 'bg-slate-500',
          label: 'เสร็จสิ้น',
          color: 'text-slate-800',
          desc: 'ขอบคุณที่ใช้บริการ',
        }
      default:
        return {
          icon: Clock,
          bg: 'bg-slate-50 border-slate-200',
          dot: 'bg-slate-400',
          label: booking.status,
          color: 'text-slate-700',
          desc: '',
        }
    }
  })()

  const Icon = cfg.icon
  return (
    <div className={`rounded-2xl border ${cfg.bg} p-4 sm:p-5 flex items-start gap-3`}>
      <div className="relative flex-shrink-0">
        <Icon className={cfg.color} size={22} />
        <span
          className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${cfg.dot} animate-pulse`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-base sm:text-lg font-bold ${cfg.color}`}>
            {cfg.label}
          </p>
          <span className="font-mono text-xs text-slate-500">
            {booking.booking_code}
          </span>
        </div>
        {cfg.desc && (
          <p className="text-sm text-slate-600 mt-0.5">{cfg.desc}</p>
        )}
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          {label}
        </div>
        <div className="text-slate-900 break-words">{value}</div>
      </div>
    </div>
  )
}

function LookupForm({
  code,
  emailDraft,
  setEmailDraft,
  onSubmit,
}: {
  code: string
  emailDraft: string
  setEmailDraft: (s: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Search className="text-slate-900" size={20} />
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 text-center">
          ค้นหาการจอง
        </h1>
        <p className="text-sm text-slate-500 text-center mt-2">
          รหัสการจอง:{' '}
          <span className="font-mono text-slate-700">{code}</span>
        </p>
        <p className="text-xs text-slate-500 mt-3 mb-5 text-center">
          กรอกอีเมลที่ใช้ตอนจองเพื่อยืนยันสิทธิ์การเข้าถึง
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (emailDraft.trim()) onSubmit()
          }}
          className="space-y-3"
        >
          <input
            type="email"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            placeholder="email@example.com"
            required
            autoComplete="email"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-500"
          />
          <button
            type="submit"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
          >
            ดูรายละเอียดการจอง
          </button>
        </form>
        <p className="text-[11px] text-slate-400 mt-4 text-center">
          ยังหาการจองไม่เจอ? <Link href="/contact" className="text-slate-900 hover:underline">ติดต่อทีมงาน</Link>
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
