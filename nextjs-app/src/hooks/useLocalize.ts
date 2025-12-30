'use client'

import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'

type LocalizedValue<T> = {
  th: T
  en: T
}

export function useLocalize() {
  const { i18n } = useTranslation()
  const lang = (i18n.language || 'th') as 'th' | 'en'

  const localize = useCallback(
    <T>(value: LocalizedValue<T> | T): T => {
      if (
        value !== null &&
        typeof value === 'object' &&
        'th' in value &&
        'en' in value
      ) {
        return (value as LocalizedValue<T>)[lang]
      }
      return value as T
    },
    [lang]
  )

  // Get localized field from flat object (e.g., name_th, name_en)
  const getField = useCallback(
    (obj: object, field: string): string => {
      const key = `${field}_${lang}`
      return (obj as Record<string, string>)[key] || ''
    },
    [lang]
  )

  // Get localized array field from flat object (e.g., includes_th, includes_en)
  const getArrayField = useCallback(
    (obj: object, field: string): string[] => {
      const key = `${field}_${lang}`
      return (obj as Record<string, string[]>)[key] || []
    },
    [lang]
  )

  return { localize, getField, getArrayField, lang }
}

export default useLocalize
