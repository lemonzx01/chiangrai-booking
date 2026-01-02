'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar, X, Search } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isAfter, isBefore, isWithinInterval } from 'date-fns'
import { useTranslation } from 'react-i18next'

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (dates: [Date | null, Date | null]) => void
  placeholder?: string
  minDate?: Date
  locale?: any
}

const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  placeholder = 'เลือกวันที่',
  minDate,
}: DateRangePickerProps) => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate)
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const lang = mounted ? i18n.language : 'th'

  const monthsTh = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNamesTh = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
  const dayNamesEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const months = lang === 'th' ? monthsTh : monthsEn
  const dayNames = lang === 'th' ? dayNamesTh : dayNamesEn

  const handleDateClick = (day: Date) => {
    if (minDate && isBefore(day, minDate)) return

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(day)
      setTempEndDate(null)
    } else if (tempStartDate && !tempEndDate) {
      if (isBefore(day, tempStartDate)) {
        setTempStartDate(day)
      } else {
        setTempEndDate(day)
      }
    }
  }

  const handleConfirm = () => {
    onChange([tempStartDate, tempEndDate])
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempStartDate(null)
    setTempEndDate(null)
    onChange([null, null])
  }

  const isInRange = (day: Date) => {
    if (!tempStartDate) return false
    const end = tempEndDate || hoverDate
    if (!end) return false
    return isWithinInterval(day, {
      start: isBefore(tempStartDate, end) ? tempStartDate : end,
      end: isAfter(tempStartDate, end) ? tempStartDate : end
    })
  }

  const isRangeStart = (day: Date) => tempStartDate && isSameDay(day, tempStartDate)
  const isRangeEnd = (day: Date) => tempEndDate && isSameDay(day, tempEndDate)

  const renderCalendar = (monthOffset: number) => {
    const month = addMonths(currentMonth, monthOffset)
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const days: Date[] = []
    let day = calendarStart
    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }

    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
  }

  return (
      <div className="flex-1 min-w-[280px]">
        {/* Month Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white">
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
          
          <h3 className="text-base font-bold text-slate-900">
            {months[month.getMonth()]} {lang === 'th' ? month.getFullYear() + 543 : month.getFullYear()}
          </h3>
          
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

        {/* Day Names */}
        <div className="grid grid-cols-7 py-3 bg-white border-b border-slate-100">
          {dayNames.map((name, i) => (
            <div key={i} className="text-center text-xs font-bold text-slate-600">
              {name}
            </div>
          ))}
        </div>

        {/* Days */}
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

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '—'
    if (lang === 'th') {
      const monthsTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
      return `${date.getDate()} ${monthsTh[date.getMonth()]}`
    }
    return format(date, 'dd MMM')
  }

  const displayText = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'dd/MM/yy')} → ${format(endDate, 'dd/MM/yy')}`
    }
    if (startDate) {
      return `${format(startDate, 'dd/MM/yy')} → —`
    }
    return placeholder
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
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
          {/* Header with selected dates */}
          <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-600 mb-2">{lang === 'th' ? 'วันเข้าพัก' : 'Check-in'}</p>
                <p className="text-2xl font-bold text-slate-900">{formatDisplayDate(tempStartDate)}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0">
                <ChevronRight size={20} className="text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-600 mb-2">{lang === 'th' ? 'วันคืนห้อง' : 'Check-out'}</p>
                <p className="text-2xl font-bold text-slate-900">{formatDisplayDate(tempEndDate)}</p>
              </div>
            </div>
            {tempStartDate && tempEndDate && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <span className="text-sm font-semibold text-indigo-600">
                  {Math.ceil((tempEndDate.getTime() - tempStartDate.getTime()) / (1000 * 60 * 60 * 24))} {lang === 'th' ? 'คืน' : 'nights'}
                </span>
              </div>
            )}
          </div>

          {/* Calendars */}
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {renderCalendar(0)}
            {renderCalendar(1)}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-slate-200 bg-white">
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
            >
              {lang === 'th' ? 'ล้างข้อมูล' : 'Clear'}
            </button>
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

export default DateRangePicker
