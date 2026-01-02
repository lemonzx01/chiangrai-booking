'use client'

import { forwardRef, useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonth, getYear, format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Locale } from 'date-fns'

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (dates: [Date | null, Date | null]) => void
  placeholder?: string
  minDate?: Date
  locale?: Locale
}

const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, placeholder, startDate, endDate }, ref) => {
  const formatDisplay = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
    }
    if (startDate) {
      return `${format(startDate, 'dd/MM/yyyy')} - ?`
    }
    return null
  }

  const displayValue = formatDisplay()

  return (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-full text-base text-slate-800 font-semibold bg-transparent outline-none cursor-pointer text-left flex items-center gap-2"
    >
      <span className="flex-1">
        {displayValue || <span className="text-slate-400 font-semibold">{placeholder}</span>}
      </span>
    </button>
  )
})

CustomInput.displayName = 'CustomInput'

const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  placeholder = 'เลือกวันที่',
  minDate,
  locale,
}: DateRangePickerProps) => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const lang = mounted ? i18n.language : 'th'

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i)

  const monthsTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const months = lang === 'th' ? monthsTh : monthsEn

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    onChange(dates)
    if (start && end) {
      setIsOpen(false)
    }
  }

  return (
    <DatePicker
      selected={startDate}
      onChange={handleDateChange}
      startDate={startDate}
      endDate={endDate}
      selectsRange
      open={isOpen}
      onInputClick={() => setIsOpen(true)}
      onClickOutside={() => setIsOpen(false)}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      minDate={minDate}
      locale={locale}
      customInput={<CustomInput startDate={startDate} endDate={endDate} />}
      showPopperArrow={false}
      popperPlacement="bottom-start"
      popperProps={{
        strategy: 'fixed',
      }}
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} className="text-slate-600" />
          </button>

          <div className="flex items-center gap-2">
            <select
              value={getMonth(date)}
              onChange={({ target: { value } }) => changeMonth(parseInt(value))}
              className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {months.map((month, i) => (
                <option key={month} value={i}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={getYear(date)}
              onChange={({ target: { value } }) => changeYear(parseInt(value))}
              className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {lang === 'th' ? year + 543 : year}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>
      )}
    />
  )
}

export default DateRangePicker
