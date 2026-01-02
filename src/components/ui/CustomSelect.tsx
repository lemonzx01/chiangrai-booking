'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'

interface Option {
  value: string
  label: string
  code?: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-base text-slate-800 font-semibold bg-transparent outline-none cursor-pointer text-left"
      >
        <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
          {selectedOption?.label || placeholder}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full -left-12 mt-3 bg-white rounded-xl z-50 w-[240px] border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
          <div className="p-2">
            <div className="flex flex-col gap-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all ${
                    value === option.value
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <MapPin size={16} className={`flex-shrink-0 ${value === option.value ? 'text-white' : 'text-indigo-600'}`} />
                  <span className="text-sm font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
