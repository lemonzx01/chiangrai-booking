/**
 * ============================================================
 * DateRangePicker Component - ตัวเลือกช่วงวันที่ (เช็คอิน-เช็คเอาท์)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - เลือกช่วงวันที่สำหรับการจองห้องพัก
 *   - แสดงปฏิทิน 2 เดือนพร้อมกัน
 *   - รองรับหลายภาษา (ไทย/อังกฤษ)
 *
 * คุณสมบัติ:
 *   - แสดงจำนวนคืนที่เลือก
 *   - Highlight ช่วงวันที่เลือก
 *   - รองรับ minDate สำหรับจำกัดวันที่เลือกได้
 *   - ปุ่มล้างข้อมูลและค้นหา
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar, X, Search } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isAfter, isBefore, isWithinInterval } from 'date-fns'
import { useTranslation } from 'react-i18next'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Props สำหรับ DateRangePicker component
 */
interface DateRangePickerProps {
  /** วันเริ่มต้น (เช็คอิน) */
  startDate: Date | null
  /** วันสิ้นสุด (เช็คเอาท์) */
  endDate: Date | null
  /** Callback เมื่อเลือกช่วงวันที่ */
  onChange: (dates: [Date | null, Date | null]) => void
  /** ข้อความ placeholder */
  placeholder?: string
  /** วันที่ต่ำสุดที่เลือกได้ */
  minDate?: Date
  /** Locale สำหรับ date-fns */
  locale?: any
}

// ============================================================
// Component Definition
// ============================================================

/**
 * DateRangePicker component
 *
 * @description ตัวเลือกช่วงวันที่สำหรับการจองห้องพัก
 *              แสดงปฏิทิน 2 เดือนพร้อมกัน
 *              รองรับการเลือกช่วงวันที่พร้อมแสดง highlight
 *
 * @param props - DateRangePickerProps
 * @returns DateRangePicker component
 *
 * @example
 * <DateRangePicker
 *   startDate={checkIn}
 *   endDate={checkOut}
 *   onChange={([start, end]) => { setCheckIn(start); setCheckOut(end); }}
 *   minDate={new Date()}
 * />
 */
const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  placeholder = 'เลือกวันที่',
  minDate,
}: DateRangePickerProps) => {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------

  const { i18n } = useTranslation()

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  /** สถานะเปิด/ปิด popup */
  const [isOpen, setIsOpen] = useState(false)

  /** ตรวจสอบว่า component mount แล้ว (ป้องกัน hydration mismatch) */
  const [mounted, setMounted] = useState(false)

  /** เดือนปัจจุบันที่แสดง (เดือนซ้าย) */
  const [currentMonth, setCurrentMonth] = useState(new Date())

  /** วันเริ่มต้นชั่วคราว (ก่อนกดยืนยัน) */
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate)

  /** วันสิ้นสุดชั่วคราว (ก่อนกดยืนยัน) */
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate)

  /** วันที่ hover (สำหรับแสดง preview ช่วง) */
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  // ----------------------------------------------------------
  // Refs
  // ----------------------------------------------------------

  /** Ref สำหรับ container (ใช้ตรวจจับ click outside) */
  const containerRef = useRef<HTMLDivElement>(null)

  // ----------------------------------------------------------
  // Effects
  // ----------------------------------------------------------

  /** ตั้ง mounted เป็น true เมื่อ component mount */
  useEffect(() => {
    setMounted(true)
  }, [])

  /** Sync tempStartDate และ tempEndDate เมื่อเปิด popup */
  useEffect(() => {
    if (isOpen) {
      setTempStartDate(startDate)
      setTempEndDate(endDate)
      if (startDate) {
        setCurrentMonth(startDate)
      } else {
        setCurrentMonth(new Date())
      }
    }
  }, [isOpen, startDate, endDate])

  /** ปิด popup เมื่อคลิกด้านนอก */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ----------------------------------------------------------
  // Constants (ค่าคงที่)
  // ----------------------------------------------------------

  /** ภาษาปัจจุบัน */
  const lang = mounted ? i18n.language : 'th'

  /** ชื่อเดือนภาษาไทย (เต็ม) */
  const monthsTh = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

  /** ชื่อเดือนภาษาอังกฤษ */
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  /** ชื่อวันภาษาไทย (ย่อ) */
  const dayNamesTh = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

  /** ชื่อวันภาษาอังกฤษ (ย่อ) */
  const dayNamesEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  /** เลือกชื่อเดือนและวันตามภาษา */
  const months = lang === 'th' ? monthsTh : monthsEn
  const dayNames = lang === 'th' ? dayNamesTh : dayNamesEn

  // ----------------------------------------------------------
  // Handlers (ฟังก์ชันจัดการ Events)
  // ----------------------------------------------------------

  /**
   * จัดการเมื่อคลิกวันที่
   * - ถ้ายังไม่มีวันเริ่มต้น หรือมีครบทั้ง 2 วันแล้ว -> ตั้งวันเริ่มต้นใหม่
   * - ถ้ามีวันเริ่มต้นแล้ว -> ตั้งวันสิ้นสุด (หรือสลับถ้าเลือกวันก่อนหน้า)
   */
  const handleDateClick = (day: Date) => {
    // ถ้าวันที่น้อยกว่า minDate ไม่ให้เลือก
    if (minDate && isBefore(day, minDate)) return

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // เริ่มเลือกใหม่
      setTempStartDate(day)
      setTempEndDate(null)
    } else if (tempStartDate && !tempEndDate) {
      // เลือกวันที่ 2
      if (isBefore(day, tempStartDate)) {
        // ถ้าเลือกวันก่อนหน้า ให้สลับ
        setTempStartDate(day)
      } else {
        setTempEndDate(day)
      }
    }
  }

  /**
   * ยืนยันการเลือกช่วงวันที่
   */
  const handleConfirm = () => {
    onChange([tempStartDate, tempEndDate])
    setIsOpen(false)
  }

  /**
   * ล้างการเลือก
   */
  const handleClear = () => {
    setTempStartDate(null)
    setTempEndDate(null)
    onChange([null, null])
  }

  // ----------------------------------------------------------
  // Helper Functions (ฟังก์ชันช่วย)
  // ----------------------------------------------------------

  /**
   * ตรวจสอบว่าวันอยู่ในช่วงที่เลือกหรือไม่
   */
  const isInRange = (day: Date) => {
    if (!tempStartDate) return false
    const end = tempEndDate || hoverDate
    if (!end) return false
    return isWithinInterval(day, {
      start: isBefore(tempStartDate, end) ? tempStartDate : end,
      end: isAfter(tempStartDate, end) ? tempStartDate : end
    })
  }

  /** ตรวจสอบว่าเป็นวันเริ่มต้นหรือไม่ */
  const isRangeStart = (day: Date) => tempStartDate && isSameDay(day, tempStartDate)

  /** ตรวจสอบว่าเป็นวันสิ้นสุดหรือไม่ */
  const isRangeEnd = (day: Date) => tempEndDate && isSameDay(day, tempEndDate)

  /**
   * Render ปฏิทินสำหรับเดือนที่กำหนด
   * @param monthOffset - 0 = เดือนปัจจุบัน, 1 = เดือนถัดไป
   */
  const renderCalendar = (monthOffset: number) => {
    const month = addMonths(currentMonth, monthOffset)
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    // สร้าง array ของวันทั้งหมดที่จะแสดง
    const days: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }

    // แบ่งเป็นสัปดาห์ (7 วัน)
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="flex-1 min-w-[280px]">
        {/* Header เดือน */}
        <div className="flex items-center justify-between px-5 py-4 bg-white">
          {/* ปุ่มเดือนก่อนหน้า (แสดงเฉพาะเดือนซ้าย) */}
          {monthOffset === 0 ? (
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          {/* ชื่อเดือน ปี */}
          <h3 className="text-base font-bold text-slate-900">
            {months[month.getMonth()]} {lang === 'th' ? month.getFullYear() + 543 : month.getFullYear()}
          </h3>

          {/* ปุ่มเดือนถัดไป (แสดงเฉพาะเดือนขวา) */}
          {monthOffset === 1 ? (
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* ชื่อวันในสัปดาห์ */}
        <div className="grid grid-cols-7 py-3 bg-white border-b border-slate-100">
          {dayNames.map((name, i) => (
            <div key={i} className="text-center text-xs font-bold text-slate-600">
              {name}
            </div>
          ))}
        </div>

        {/* วันที่ */}
        <div className="px-4 py-3">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, month)
                const isDisabled = minDate && isBefore(day, minDate)
                const isStart = isRangeStart(day)
                const isEnd = isRangeEnd(day)
                const inRange = isInRange(day) && !isStart && !isEnd
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={dayIndex}
                    className={`
                      relative flex items-center justify-center
                      ${inRange ? 'bg-indigo-100' : ''}
                      ${isStart && !isEnd ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-100' : ''}
                      ${isEnd && !isStart ? 'bg-gradient-to-l from-indigo-600 via-indigo-600 to-indigo-100' : ''}
                    `}
                  >
                    <button
                      type="button"
                      onClick={() => handleDateClick(day)}
                      onMouseEnter={() => setHoverDate(day)}
                      onMouseLeave={() => setHoverDate(null)}
                      disabled={isDisabled || !isCurrentMonth}
                      className={`
                        relative w-full h-11 text-sm font-semibold transition-all z-10
                        ${!isCurrentMonth ? 'text-slate-300 cursor-default' : ''}
                        ${isStart || isEnd ? 'bg-indigo-600 text-white shadow-md' : ''}
                        ${!isStart && !isEnd && isCurrentMonth && !isDisabled ? 'hover:bg-indigo-200' : ''}
                        ${!isStart && !isEnd && isCurrentMonth && !isDisabled ? 'text-slate-700' : ''}
                        ${isDisabled ? 'text-slate-300 cursor-not-allowed' : ''}
                      `}
                    >
                      {day.getDate()}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  /**
   * Format วันที่สำหรับแสดงใน header
   */
  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '—'
    if (lang === 'th') {
      const monthsTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
      return `${date.getDate()} ${monthsTh[date.getMonth()]}`
    }
    return format(date, 'dd MMM')
  }

  /**
   * สร้างข้อความที่แสดงในปุ่ม trigger
   */
  const displayText = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'dd/MM/yy')} → ${format(endDate, 'dd/MM/yy')}`
    }
    if (startDate) {
      return `${format(startDate, 'dd/MM/yy')} → —`
    }
    return placeholder
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div ref={containerRef} className="relative">
      {/* ปุ่ม Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-base font-semibold bg-transparent outline-none cursor-pointer"
      >
        <span className={startDate ? 'text-slate-800' : 'text-slate-400'}>
          {displayText()}
        </span>
      </button>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full -left-12 mt-3 z-50 bg-white rounded-xl shadow-2xl border-2 border-indigo-500 overflow-hidden animate-scale-up w-full md:w-auto md:min-w-[680px]">
          {/* Header แสดงวันที่เลือก */}
          <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-6">
              {/* วันเช็คอิน */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  {lang === 'th' ? 'วันเข้าพัก' : 'Check-in'}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatDisplayDate(tempStartDate)}
                </p>
              </div>

              {/* ลูกศร */}
              <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0">
                <ChevronRight size={20} className="text-slate-600" />
              </div>

              {/* วันเช็คเอาท์ */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  {lang === 'th' ? 'วันคืนห้อง' : 'Check-out'}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatDisplayDate(tempEndDate)}
                </p>
              </div>
            </div>

            {/* แสดงจำนวนคืน */}
            {tempStartDate && tempEndDate && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <span className="text-sm font-semibold text-indigo-600">
                  {Math.ceil((tempEndDate.getTime() - tempStartDate.getTime()) / (1000 * 60 * 60 * 24))} {lang === 'th' ? 'คืน' : 'nights'}
                </span>
              </div>
            )}
          </div>

          {/* ปฏิทิน 2 เดือน */}
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {renderCalendar(0)}
            {renderCalendar(1)}
          </div>

          {/* Footer พร้อมปุ่ม */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-slate-200 bg-white">
            {/* ปุ่มล้าง */}
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
            >
              {lang === 'th' ? 'ล้างข้อมูล' : 'Clear'}
            </button>

            {/* ปุ่มค้นหา */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!tempStartDate || !tempEndDate}
              className="flex items-center gap-2 px-8 py-3 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg"
            >
              <Search size={18} />
              {lang === 'th' ? 'ค้นหา' : 'Search'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Export
// ============================================================

export default DateRangePicker
