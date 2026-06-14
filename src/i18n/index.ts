import { createI18n } from 'vue-i18n';

import en from './messages/en';
import es from './messages/es';

export type SupportedLocale = 'es' | 'en';

export const defaultLocale: SupportedLocale = 'es';
export const localeStorageKey = 'lockerops.locale';
export const supportedLocales = ['es', 'en'] as const;
export const supportedLocaleOptions: Array<{
  code: SupportedLocale;
  label: string;
  ariaKey: 'language.switchToEs' | 'language.switchToEn';
}> = [
  { code: 'es', label: 'ES', ariaKey: 'language.switchToEs' },
  { code: 'en', label: 'EN', ariaKey: 'language.switchToEn' },
];

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === 'string' &&
    supportedLocales.includes(value as SupportedLocale)
  );
}

function readStoredLocale(): SupportedLocale {
  try {
    const storedLocale = window.localStorage.getItem(localeStorageKey);

    if (isSupportedLocale(storedLocale)) {
      return storedLocale;
    }
  } catch {
    return defaultLocale;
  }

  return defaultLocale;
}

export function setStoredLocale(locale: SupportedLocale): void {
  try {
    window.localStorage.setItem(localeStorageKey, locale);
  } catch {
    // The UI can still switch language if storage is unavailable.
  }
}

export function setDocumentLocale(locale: SupportedLocale): void {
  document.documentElement.lang = locale;
}

export const initialLocale = readStoredLocale();

setDocumentLocale(initialLocale);

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: defaultLocale,
  messages: {
    es,
    en,
  },
});

export default i18n;
