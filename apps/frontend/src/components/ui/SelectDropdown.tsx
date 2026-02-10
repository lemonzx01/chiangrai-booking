'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  dot?: string
}

interface SelectDropdownProps {
  options: SelectOption[]
  value: string | number
  onChange: (value: string) => void
  className?: string
}

export default function SelectDropdown({
  options,
  value,
  onChange,
  className = '',
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => String(o.value) === String(value))

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm hover:border-slate-300 transition-colors bg-white"
      >
        {selected?.dot && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dot}`} />
        )}
        <span className="flex-1 text-left font-medium text-slate-700">
          {selected?.label || 'เลือก...'}
        </span>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1 max-h-60 overflow-y-auto min-w-[180px]">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => { onChange(String(opt.value)); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                String(value) === String(opt.value) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              {opt.dot && <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />}
              <span className="font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
