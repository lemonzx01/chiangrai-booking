/**
 * ============================================================
 * Admin Manual Booking Form (Client Component)
 * ============================================================
 *
 * Stateful form for admins to create an off-platform booking.
 * Mirrors the backend validation at
 * POST /api/admin/bookings — see that route for the exact
 * field contract. This file holds no business rules beyond
 * UI-level sanity checks (date ordering, required fields)
 * so the backend stays the single source of truth.
 * ============================================================
 */

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api'

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

interface HotelOption {
  id: string
  name_th: string
  name_en?: string | null
}
interface CarOption {
  id: string
  name_th: string
  name_en?: string | null
}
interface RoomTypeOption {
  id: string
  hotel_id: string
  name_th: string
  name_en?: string | null
}

export interface ResourcesPayload {
  hotels: HotelOption[]
  cars: CarOption[]
  room_types: RoomTypeOption[]
  is_admin: boolean
}

type BookingType = 'HOTEL' | 'CAR' | 'COMBO'
type PaymentMethod = 'cash' | 'bank_transfer' | 'line_pay' | 'other'

// ---------------------------------------------------------------
// Component
// ---------------------------------------------------------------

export default function NewBookingForm({ resources }: { resources: ResourcesPayload }) {
  const router = useRouter()

  const [bookingType, setBookingType] = useState<BookingType>('HOTEL')
  const [hotelId, setHotelId] = useState<string>('')
  const [roomTypeId, setRoomTypeId] = useState<string>('')
  const [carId, setCarId] = useState<string>('')

  const today = new Date().toISOString().slice(0, 10)
  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState(today)
  const [guests, setGuests] = useState(1)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  const [totalPrice, setTotalPrice] = useState('')
  const [currency, setCurrency] = useState<'THB' | 'USD' | 'EUR'>('THB')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [paid, setPaid] = useState(true)
  const [force, setForce] = useState(false)
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // room_types filtered to the currently selected hotel
  const roomTypesForHotel = useMemo(
    () => resources.room_types.filter((rt) => rt.hotel_id === hotelId),
    [resources.room_types, hotelId]
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // --- UI-level sanity checks
    if (bookingType === 'HOTEL' && !hotelId) {
      setError('กรุณาเลือกโรงแรม')
      return
    }
    if (bookingType === 'CAR' && !carId) {
      setError('กรุณาเลือกรถ')
      return
    }
    if (bookingType === 'COMBO' && (!hotelId || !carId)) {
      setError('Combo ต้องเลือกทั้งโรงแรมและรถ')
      return
    }
    if (checkOut <= checkIn) {
      setError('วันเช็คเอาท์ต้องอยู่หลังวันเช็คอิน')
      return
    }
    const priceNum = Number(totalPrice)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError('ยอดรวมต้องมากกว่า 0')
      return
    }
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setError('กรุณากรอกข้อมูลลูกค้าให้ครบ')
      return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        booking_type: bookingType,
        hotel_id: bookingType === 'CAR' ? undefined : hotelId || undefined,
        car_id: bookingType === 'HOTEL' ? undefined : carId || undefined,
        room_type_id: bookingType === 'CAR' ? undefined : roomTypeId || undefined,
        check_in_date: checkIn,
        check_out_date: checkOut,
        number_of_guests: Number(guests) || 1,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        special_requests: specialRequests.trim() || undefined,
        total_price: priceNum,
        currency,
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim() || undefined,
        paid,
        notes: notes.trim() || undefined,
        force,
      }
      const res = await apiFetch('/api/admin/bookings', {
        method: 'POST',
        body,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || 'สร้างการจองไม่สำเร็จ')
        return
      }
      router.push('/admin/bookings')
      router.refresh()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} />
          กลับไปหน้าจัดการการจอง
        </Link>
      </div>

      {/* ---- Section: Booking target */}
      <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">ข้อมูลการจอง</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ประเภท</label>
          <div className="flex gap-2">
            {(['HOTEL', 'CAR', 'COMBO'] as BookingType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBookingType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  bookingType === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t === 'HOTEL' ? 'โรงแรม' : t === 'CAR' ? 'รถเช่า' : 'โรงแรม + รถ'}
              </button>
            ))}
          </div>
        </div>

        {bookingType !== 'CAR' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                โรงแรม <span className="text-red-500">*</span>
              </label>
              <select
                value={hotelId}
                onChange={(e) => {
                  setHotelId(e.target.value)
                  setRoomTypeId('')
                }}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- เลือกโรงแรม --</option>
                {resources.hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name_th}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ประเภทห้อง (ไม่บังคับ)
              </label>
              <select
                value={roomTypeId}
                onChange={(e) => setRoomTypeId(e.target.value)}
                disabled={!hotelId}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">-- ไม่ระบุ --</option>
                {roomTypesForHotel.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name_th}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {bookingType !== 'HOTEL' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              รถเช่า <span className="text-red-500">*</span>
            </label>
            <select
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- เลือกรถ --</option>
              {resources.cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_th}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              วันเช็คอิน <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              วันเช็คเอาท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              min={checkIn}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนผู้เข้าพัก</label>
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </section>

      {/* ---- Section: Customer */}
      <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">ข้อมูลลูกค้า</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              เบอร์โทร <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            อีเมล <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">คำขอพิเศษ</label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </section>

      {/* ---- Section: Payment */}
      <section className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">การชำระเงิน</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ยอดรวม <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">สกุลเงิน</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'THB' | 'USD' | 'EUR')}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="THB">THB</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ช่องทางรับเงิน</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="cash">เงินสด</option>
              <option value="bank_transfer">โอนธนาคาร</option>
              <option value="line_pay">LINE Pay</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              เลขอ้างอิง (ใบเสร็จ / slip)
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="ไม่บังคับ"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">
            ชำระเงินแล้ว (Mark as PAID)
            <span className="block text-xs text-slate-500 mt-0.5">
              ถ้าไม่ติ๊ก ระบบจะบันทึกเป็น CONFIRMED (ยังไม่เพิ่มรายการ payment)
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-slate-700">
            บังคับบันทึก (ข้ามการตรวจสอบห้อง/รถว่าง)
            <span className="block text-xs text-amber-700 mt-0.5">
              ⚠ ใช้เมื่อจำเป็นเท่านั้น — อาจทำให้ห้อง/รถถูกจองซ้ำซ้อน
            </span>
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            หมายเหตุสำหรับทีม (ไม่แสดงให้ลูกค้า)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="เช่น ลูกค้าประจำ ขอส่วนลดพิเศษ"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/admin/bookings"
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 text-center"
        >
          ยกเลิก
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            'บันทึกการจอง'
          )}
        </button>
      </div>
    </form>
  )
}
