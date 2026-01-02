import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import thCommon from './locales/th/common.json'
import enCommon from './locales/en/common.json'

const resources = {
  th: {
    common: thCommon,
  },
  en: {
    common: enCommon,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'th', // Always start with Thai to prevent hydration mismatch
  fallbackLng: 'th',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
