import { useTranslation } from 'react-i18next';

export type Localized<T = string> = T | { th: T; en: T };

// Hook that returns a function to localize a value
export function useLocalize() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'th') as 'th' | 'en';

  const localize = <T = string>(value: Localized<T>): T => {
    if (value && typeof value === 'object' && 'th' in value && 'en' in value) {
      return (value as any)[lang] as T;
    }
    return value as T;
  };

  return localize;
}

