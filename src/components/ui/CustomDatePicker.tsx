'use client'

import { forwardRef, useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonth, getYear } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Locale } from 'date-fns'

interface CustomDatePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  onClose?: () => void
  minDate?: Date
  locale?: Locale
}

const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick, placeholder }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    className="w-full text-base text-slate-800 font-semibold bg-transparent outline-none cursor-pointer text-left flex items-center gap-2"
  >
    <span className="flex-1">{value || <span className="text-slate-400 font-semibold">{placeholder}</span>}</span>
  </button>
))

CustomInput.displayName = 'CustomInput'

const CustomDatePicker = ({
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  minDate,
  locale,
  onClose,
}: CustomDatePickerProps) => {
  const { t, i18n } = useTranslation()
  const [tempDate, setTempDate] = useState<Date | null>(value || null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTempDate(value ?? null)
    }
  }, [isOpen, value])

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i)
  
  const monthsTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const months = i18n.language === 'th' ? monthsTh : monthsEn

  const handleConfirm = () => {
    onChange(tempDate)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempDate(value ?? null)
    setIsOpen(false)
  }

  return (
    <DatePicker
      selected={tempDate}
      onChange={(date: Date | null) => setTempDate(date)}
      open={isOpen}
      onInputClick={() => setIsOpen(true)}
      onClickOutside={handleCancel}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      minDate={minDate}
      locale={locale}
      customInput={<CustomInput />}
      withPortal
      portalId="datepicker-root"
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
                  {i18n.language === 'th' ? year + 543 : year}
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
    >
      <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors px-5 py-2 rounded-lg hover:bg-slate-100"
        >
          <X size={16} />
          <span>{i18n.language === 'th' ? 'ยกเลิก' : 'Cancel'}</span>
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-5 py-2 rounded-lg"
        >
          <Check size={16} />
          <span>{i18n.language === 'th' ? 'ตกลง' : 'OK'}</span>
        </button>
      </div>
    </DatePicker>
  )
}

export default CustomDatePicker

