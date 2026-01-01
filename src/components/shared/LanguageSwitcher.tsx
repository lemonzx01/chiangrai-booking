'use client'

import { useTranslation } from 'react-i18next'

interface Props {
  light?: boolean
}

export default function LanguageSwitcher({ light = true }: Props) {
  const { i18n } = useTranslation()
  const currentLanguage = i18n.language

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('lng', lng)
  }

  const baseInactive = light
    ? 'text-slate-500 hover:text-indigo-600'
    : 'text-white/80 hover:text-white'
  const activeClass = light ? 'text-indigo-600 font-bold' : 'text-white font-bold'

  return (
    <div className="flex items-center space-x-2 select-none">
      <button
        onClick={() => changeLanguage('th')}
        className={`px-1.5 py-0.5 rounded-md transition-colors ${
          currentLanguage === 'th' ? activeClass : baseInactive
        }`}
      >
        TH
      </button>
      <span className={light ? 'text-slate-300' : 'text-white/40'}>|</span>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-1.5 py-0.5 rounded-md transition-colors ${
          currentLanguage === 'en' ? activeClass : baseInactive
        }`}
      >
        EN
      </button>
    </div>
  )
}
