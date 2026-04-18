'use client'

/**
 * ============================================================
 * Partner Availability Calendar (Client)
 * ============================================================
 *
 * Lets a partner:
 *   - pick one of their hotels (with optional room type) or cars
 *   - see a month calendar with days marked:
 *       red stripe    = existing booking (cannot be removed here)
 *       gray stripe   = partner-created block
 *       dot           = number of active bookings on that day
 *   - click "Add block" to create a new block (date range + reason)
 *   - delete their own blocks inline
 *
 * Keep it dependency-light — no FullCalendar etc. Just a native
 * month grid rebuilt per page-selected month.
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Info, Plus, Trash2, X } from 'lucide-react'

import { apiFetch, apiJson } from '@/lib/api'

// ---- Types ----------------------------------------------------

interface Hotel {
  id: string
  name_th: string
  name_en: string | null
}
interface Car {
  id: string
  name_th: string
  name_en: string | null
}
interface RoomType {
  id: string
  hotel_id: string
  name_th: string
  name_en: string | null
}
interface Block {
  id: string
  hotel_id: string | null
  room_type_id: string | null
  car_id: string | null
  start_date: string
  end_date: string
  reason: string
  notes: string | null
  created_at: string
}
interface BookingLite {
  id: string
  booking_code: string
  check_in_date: string
  check_out_date: string
  status: string
  customer_name: string
  room_type_id: string | null
}

type Target =
  | { kind: 'hotel'; hotelId: string; roomTypeId: string | null }
  | { kind: 'car'; carId: string }
  | null

// ---- Date helpers --------------------------------------------

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function monthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

// ---- Component -----------------------------------------------

interface Props {
  initialResources: {
    hotels: Hotel[]
    cars: Car[]
    room_types: RoomType[]
    is_admin: boolean
  }
}

export default function AvailabilityClient({ initialResources }: Props) {
  const { hotels, cars, room_types } = initialResources

  const [target, setTarget] = useState<Target>(() => {
    if (hotels[0]) return { kind: 'hotel', hotelId: hotels[0].id, roomTypeId: null }
    if (cars[0]) return { kind: 'car', carId: cars[0].id }
    return null
  })

  const [cursor, setCursor] = useState<Date>(() => monthStart(new Date()))
  const [blocks, setBlocks] = useState<Block[]>([])
  const [bookings, setBookings] = useState<BookingLite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formReason, setFormReason] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ---- Fetch blocks + bookings for the current target / visible window ----
  const fetchData = useCallback(async () => {
    if (!target) {
      setBlocks([])
      setBookings([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Query a window that covers the visible 42-day grid.
      const from = toIso(addDays(monthStart(cursor), -7))
      const to = toIso(addDays(monthEnd(cursor), 7))

      const params = new URLSearchParams()
      if (target.kind === 'hotel') params.set('hotel_id', target.hotelId)
      if (target.kind === 'car') params.set('car_id', target.carId)
      params.set('from', from)
      params.set('to', to)

      const res = await apiFetch(`/api/partner/availability?${params.toString()}`)
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'โหลดข้อมูลล้มเหลว')
      }
      const body = (await res.json()) as { data: Block[]; bookings: BookingLite[] }

      // For hotel+roomType targets, filter booking dots down to the selected room_type.
      let filteredBookings = body.bookings || []
      if (target.kind === 'hotel' && target.roomTypeId) {
        filteredBookings = filteredBookings.filter((b) => b.room_type_id === target.roomTypeId)
      }
      setBlocks(body.data || [])
      setBookings(filteredBookings)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [target, cursor])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // ---- Calendar grid: 6 weeks, starting on the Sunday before month ----
  const grid = useMemo(() => {
    const first = monthStart(cursor)
    const leadOffset = first.getDay() // 0..6
    const start = addDays(first, -leadOffset)
    const cells: Date[] = []
    for (let i = 0; i < 42; i++) cells.push(addDays(start, i))
    return cells
  }, [cursor])

  // ---- Per-day block + booking lookup ----
  const dayInfo = useMemo(() => {
    const byDay = new Map<string, { blocks: Block[]; bookings: BookingLite[] }>()
    grid.forEach((d) => byDay.set(toIso(d), { blocks: [], bookings: [] }))

    const selectedRoomType = target?.kind === 'hotel' ? target.roomTypeId : null

    blocks.forEach((b) => {
      // If room-type is selected, only show blocks that match that room OR are hotel-wide.
      if (selectedRoomType) {
        if (b.room_type_id && b.room_type_id !== selectedRoomType) return
      }
      const startD = parseIso(b.start_date)
      const endD = parseIso(b.end_date)
      for (let d = new Date(startD); d < endD; d.setDate(d.getDate() + 1)) {
        const k = toIso(d)
        if (byDay.has(k)) byDay.get(k)!.blocks.push(b)
      }
    })

    bookings.forEach((bk) => {
      const startD = parseIso(bk.check_in_date)
      const endD = parseIso(bk.check_out_date)
      for (let d = new Date(startD); d < endD; d.setDate(d.getDate() + 1)) {
        const k = toIso(d)
        if (byDay.has(k)) byDay.get(k)!.bookings.push(bk)
      }
    })

    return byDay
  }, [grid, blocks, bookings, target])

  // ---- Handlers ----
  function openAdd(prefillDate?: string) {
    if (!target) return
    setFormStart(prefillDate || toIso(new Date()))
    setFormEnd(prefillDate ? toIso(addDays(parseIso(prefillDate), 1)) : toIso(addDays(new Date(), 1)))
    setFormReason('')
    setFormNotes('')
    setFormError(null)
    setShowAddModal(true)
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return
    if (!formReason.trim()) {
      setFormError('กรุณาระบุเหตุผล')
      return
    }
    if (formEnd <= formStart) {
      setFormError('end_date ต้องอยู่หลัง start_date')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      const payload: Record<string, unknown> = {
        start_date: formStart,
        end_date: formEnd,
        reason: formReason.trim(),
        notes: formNotes.trim() || null,
      }
      if (target.kind === 'hotel') {
        payload.hotel_id = target.hotelId
        if (target.roomTypeId) payload.room_type_id = target.roomTypeId
      } else {
        payload.car_id = target.carId
      }

      await apiJson('/api/partner/availability', { method: 'POST', body: payload })
      setShowAddModal(false)
      await fetchData()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteBlock(id: string) {
    if (!confirm('ลบรายการบล็อกนี้หรือไม่?')) return
    try {
      await apiJson(`/api/partner/availability/${id}`, { method: 'DELETE' })
      await fetchData()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  // ---- Render ----
  const monthLabel = cursor.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })
  const today = new Date()
  const isCurrentMonth = (d: Date) => d.getMonth() === cursor.getMonth()

  return (
    <div className="space-y-6">
      {/* Header + resource picker */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-600 mb-1">ประเภททรัพยากร</label>
            <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  if (hotels[0]) setTarget({ kind: 'hotel', hotelId: hotels[0].id, roomTypeId: null })
                }}
                disabled={hotels.length === 0}
                className={`px-4 py-2 text-sm font-medium ${
                  target?.kind === 'hotel' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                โรงแรม ({hotels.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  if (cars[0]) setTarget({ kind: 'car', carId: cars[0].id })
                }}
                disabled={cars.length === 0}
                className={`px-4 py-2 text-sm font-medium border-l border-slate-300 ${
                  target?.kind === 'car' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                รถเช่า ({cars.length})
              </button>
            </div>
          </div>

          {target?.kind === 'hotel' && (
            <>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-600 mb-1">โรงแรม</label>
                <select
                  value={target.hotelId}
                  onChange={(e) => setTarget({ kind: 'hotel', hotelId: e.target.value, roomTypeId: null })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name_th}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-600 mb-1">ประเภทห้อง (ไม่เลือก = ทุกห้อง)</label>
                <select
                  value={target.roomTypeId ?? ''}
                  onChange={(e) =>
                    setTarget({
                      kind: 'hotel',
                      hotelId: target.hotelId,
                      roomTypeId: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">— ทุกห้อง (บล็อกระดับโรงแรม) —</option>
                  {room_types
                    .filter((r) => r.hotel_id === target.hotelId)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name_th}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          {target?.kind === 'car' && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-600 mb-1">รถเช่า</label>
              <select
                value={target.carId}
                onChange={(e) => setTarget({ kind: 'car', carId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_th}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => openAdd()}
            disabled={!target}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            เพิ่มวันที่บล็อก
          </button>
        </div>

        {hotels.length === 0 && cars.length === 0 && (
          <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <span>คุณยังไม่มีโรงแรมหรือรถในระบบ — ต้องเพิ่มก่อนจึงจะใช้ปฏิทินได้</span>
          </div>
        )}
      </div>

      {/* Month calendar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCursor(addDays(monthStart(cursor), -1))}
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <CalendarDays size={18} />
            {monthLabel}
          </div>
          <button
            type="button"
            onClick={() => setCursor(monthStart(addDays(monthEnd(cursor), 1)))}
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 mb-1 text-center text-xs font-medium text-slate-500">
          {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d) => {
            const key = toIso(d)
            const info = dayInfo.get(key)
            const isToday = sameDay(d, today)
            const inMonth = isCurrentMonth(d)
            const blocksOnDay = info?.blocks || []
            const bookingsOnDay = info?.bookings || []
            const hasBlock = blocksOnDay.length > 0
            const hasBooking = bookingsOnDay.length > 0

            return (
              <button
                key={key}
                type="button"
                onClick={() => openAdd(key)}
                disabled={!target}
                className={`relative min-h-[70px] rounded-lg border text-left p-1.5 transition ${
                  inMonth ? 'bg-white' : 'bg-slate-50 text-slate-400'
                } ${isToday ? 'border-indigo-500' : 'border-slate-200'} hover:border-indigo-400 disabled:cursor-not-allowed disabled:hover:border-slate-200`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-medium ${isToday ? 'text-indigo-600' : ''}`}>{d.getDate()}</span>
                  {hasBooking && (
                    <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 min-w-[16px] text-center">
                      {bookingsOnDay.length}
                    </span>
                  )}
                </div>
                {hasBlock && (
                  <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-0.5">
                    {blocksOnDay.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="text-[10px] bg-slate-700 text-white rounded px-1 truncate"
                        title={b.reason}
                      >
                        {b.reason}
                      </div>
                    ))}
                    {blocksOnDay.length > 2 && (
                      <div className="text-[10px] text-slate-500">+{blocksOnDay.length - 2} เพิ่มเติม</div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-700 rounded-sm"></span>
            บล็อกโดยคุณ
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            จำนวนการจอง
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-indigo-500 rounded-sm"></span>
            วันนี้
          </span>
        </div>
      </div>

      {/* Block list (easier to delete than tapping calendar) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-3">รายการบล็อกในช่วงที่แสดง</h3>
        {loading && <p className="text-sm text-slate-500">กำลังโหลด...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && blocks.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีรายการบล็อก</p>}
        {!loading && blocks.length > 0 && (
          <ul className="divide-y divide-slate-200">
            {blocks.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    {b.start_date} → {b.end_date}{' '}
                    <span className="text-slate-500">({b.reason})</span>
                  </div>
                  {b.notes && <div className="text-xs text-slate-500 mt-0.5">{b.notes}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteBlock(b.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  aria-label="Delete block"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add block modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <form onSubmit={submitAdd}>
              <div className="flex items-center justify-between p-5 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">เพิ่มวันที่บล็อก</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">วันที่เริ่ม</label>
                  <input
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">วันที่สิ้นสุด (ไม่รวม)</label>
                  <input
                    type="date"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    required
                    min={formStart}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">เช่น 1→3 หมายถึงบล็อกวันที่ 1 และ 2 (วันที่ 3 เปิดรับ)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">เหตุผล</label>
                  <input
                    type="text"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    maxLength={100}
                    required
                    placeholder="เช่น ซ่อมบำรุง, งานส่วนตัว"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ (ถ้ามี)</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                {formError && <p className="text-sm text-red-600">{formError}</p>}
              </div>

              <div className="flex justify-end gap-2 p-5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
