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
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isAfter, isBefore, isWithinInterval, differenceInDays } from 'date-fns'
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
  /** Custom trigger element (แทนข้อความ default) */
  children?: React.ReactNode
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
  children,
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

  /** ตรวจสอบว่าเป็น mobile หรือไม่ */
  const [isMobile, setIsMobile] = useState(false)

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
    // ตรวจสอบว่าเป็น mobile หรือไม่
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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
      <div className={`flex-1 ${isMobile ? 'w-full' : 'min-w-[300px]'}`}>
        {/* Header เดือน */}
        <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} bg-white border-b border-slate-100`}>
          {/* ปุ่มเดือนก่อนหน้า */}
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ChevronLeft size={isMobile ? 18 : 20} className="text-slate-600" />
          </button>

          {/* ชื่อเดือน ปี */}
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-slate-900`}>
            {months[month.getMonth()]} {lang === 'th' ? month.getFullYear() + 543 : month.getFullYear()}
          </h3>

          {/* ปุ่มเดือนถัดไป */}
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ChevronRight size={isMobile ? 18 : 20} className="text-slate-600" />
          </button>
        </div>

        {/* ชื่อวันในสัปดาห์ */}
        <div className="grid grid-cols-7 py-3 bg-white border-b border-slate-100">
          {dayNames.map((name, i) => (
            <div key={i} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {name}
            </div>
          ))}
        </div>

        {/* วันที่ */}
        <div className={`${isMobile ? 'px-2 py-2' : 'px-3 py-4'}`}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, month)
                const isDisabled = minDate && isBefore(day, minDate)
                const isStart = isRangeStart(day)
                const isEnd = isRangeEnd(day)
                const inRange = isInRange(day) && !isStart && !isEnd

                return (
                  <div
                    key={dayIndex}
                    className={`
                      relative flex flex-col items-center justify-center
                      ${inRange ? 'bg-emerald-50' : ''}
                    `}
                  >
                    <button
                      type="button"
                      onClick={() => handleDateClick(day)}
                      onMouseEnter={() => setHoverDate(day)}
                      onMouseLeave={() => setHoverDate(null)}
                      disabled={isDisabled || !isCurrentMonth}
                      className={`
                        relative w-full ${isMobile ? 'h-12' : 'h-14'} flex items-center justify-center rounded-lg transition-all z-10
                        ${!isCurrentMonth ? 'text-slate-300 cursor-default' : ''}
                        ${isStart || isEnd ? 'bg-indigo-600 text-white shadow-lg font-bold' : ''}
                        ${inRange && !isStart && !isEnd ? 'bg-emerald-50 text-slate-700' : ''}
                        ${!isStart && !isEnd && !inRange && isCurrentMonth && !isDisabled ? 'hover:bg-slate-50 text-slate-700' : ''}
                        ${isDisabled ? 'text-slate-300 cursor-not-allowed' : ''}
                        ${!isStart && !isEnd && !inRange && isCurrentMonth && !isDisabled ? 'font-medium' : ''}
                      `}
                    >
                      <span className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold leading-none`}>{day.getDate()}</span>
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
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen) }}
        className="w-full cursor-pointer"
      >
        {children || (
          <span className={`text-base font-semibold ${startDate ? 'text-slate-800' : 'text-slate-400'}`}>
            {displayText()}
          </span>
        )}
      </div>

      {/* Calendar Popup - ใช้ Portal เพื่อหลีกเลี่ยง CSS transform containment */}
      {isOpen && mounted && createPortal(
        <div className={`fixed inset-0 z-50 ${isMobile ? 'flex flex-col' : 'flex items-center justify-center p-4'} bg-black/50`}>
          <div className={`bg-white ${isMobile ? 'flex-1 flex flex-col' : 'rounded-2xl shadow-2xl overflow-hidden animate-scale-up w-full max-w-4xl max-h-[90vh] overflow-y-auto'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-slate-200 bg-white ${isMobile ? '' : 'sticky top-0 z-10'}`}>
              {!isMobile && (
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'th' ? 'เลือกวันที่' : 'Select Dates'}
                </h2>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`${isMobile ? 'ml-auto' : ''} p-2 hover:bg-slate-100 rounded-lg transition-colors`}
              >
                <X size={isMobile ? 18 : 20} className="text-slate-600" />
              </button>
            </div>

            {/* ปฏิทิน */}
            <div className={`${isMobile ? 'flex-1 overflow-y-auto' : ''} flex ${isMobile ? 'flex-col' : 'flex-col lg:flex-row'} ${isMobile ? '' : 'divide-y lg:divide-y-0 lg:divide-x divide-slate-200'}`}>
              {isMobile ? (
                // Mobile: แสดงเดือนเดียว
                renderCalendar(0)
              ) : (
                // Desktop: แสดง 2 เดือน
                <>
                  {renderCalendar(0)}
                  {renderCalendar(1)}
                </>
              )}
            </div>

            {/* Footer */}
            {!isMobile && (
              <div className="border-t border-slate-200 bg-white sticky bottom-0">
                {/* วันที่เลือกและจำนวนวัน */}
                <div className="flex items-center justify-between px-6 py-4">
                  {/* วันที่เลือก */}
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        {lang === 'th' ? 'วันเช็คอิน' : 'Check-in'}
                      </p>
                      <p className={`text-base font-bold ${tempStartDate ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {tempStartDate
                          ? format(tempStartDate, lang === 'th' ? 'EEE, d MMM' : 'EEE, MMM d')
                          : '—'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        {lang === 'th' ? 'วันเช็คเอาท์' : 'Check-out'}
                      </p>
                      <p className={`text-base font-bold ${tempEndDate ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {tempEndDate
                          ? format(tempEndDate, lang === 'th' ? 'EEE, d MMM' : 'EEE, MMM d')
                          : '—'
                        }
                      </p>
                    </div>
                    {tempStartDate && tempEndDate && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">
                          {lang === 'th' ? 'จำนวนคืน' : 'Nights'}
                        </p>
                        <p className="text-base font-bold text-indigo-600">
                          {differenceInDays(tempEndDate, tempStartDate)} {lang === 'th' ? 'คืน' : 'nights'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ปุ่ม Done */}
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!tempStartDate || !tempEndDate}
                    className="px-8 py-3 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg"
                  >
                    {lang === 'th' ? 'เสร็จสิ้น' : 'Done'}
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Footer - แสดงจำนวนวันและปุ่ม Done ด้านล่าง */}
            {isMobile && (
              <div className="border-t border-slate-200 bg-white px-4 py-3">
                {tempStartDate && tempEndDate && (
                  <div className="mb-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">
                      {lang === 'th' ? 'จำนวนคืน' : 'Nights'}
                    </p>
                    <p className="text-lg font-bold text-indigo-600">
                      {differenceInDays(tempEndDate, tempStartDate)} {lang === 'th' ? 'คืน' : 'nights'}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!tempStartDate || !tempEndDate}
                  className="w-full py-3 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                >
                  {lang === 'th' ? 'เสร็จสิ้น' : 'Done'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ============================================================
// Export
// ============================================================

export default DateRangePicker
