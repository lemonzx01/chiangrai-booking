import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common.json';
import th from './locales/th/common.json';

const resources = {
  en: {
    translation: en,
  },
  th: {
    translation: th,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lng') || 'th',
  fallbackLng: 'th',
  interpolation: {
    escapeValue: false,
  },
  // Add this for debugging
  debug: true,
});

export default i18n;

