'use client'

import { ReactNode, useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './index'

interface I18nProviderProps {
  children: ReactNode
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Restore language from localStorage on client
    const savedLng = localStorage.getItem('lng')
    if (savedLng && savedLng !== i18n.language) {
      i18n.changeLanguage(savedLng)
    }
  }, [])

  // Prevent hydration mismatch
  if (!isClient) {
    return <>{children}</>
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
