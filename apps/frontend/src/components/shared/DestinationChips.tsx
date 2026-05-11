'use client'

import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'

const DESTINATIONS = [
  { value: 'Chiang Rai', th: 'เชียงราย', en: 'Chiang Rai' },
  { value: 'Chiang Mai', th: 'เชียงใหม่', en: 'Chiang Mai' },
  { value: 'Phuket', th: 'ภูเก็ต', en: 'Phuket' },
  { value: 'Bangkok', th: 'กรุงเทพฯ', en: 'Bangkok' },
] as const

interface DestinationChipsProps {
  current: string
  onChange: (location: string) => void
}

export default function DestinationChips({ current, onChange }: DestinationChipsProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language

  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wide font-semibold mr-1 self-center">
        <MapPin size={11} />
        {lang === 'th' ? 'ปลายทางยอดนิยม' : 'Popular destinations'}
      </span>
      {DESTINATIONS.map((d) => {
        const active = current === d.value
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onChange(active ? '' : d.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              active
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            {lang === 'th' ? d.th : d.en}
          </button>
        )
      })}
    </div>
  )
}
