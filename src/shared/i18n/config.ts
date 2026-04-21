export const SUPPORTED_LOCALES = ['es', 'en'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'es'
export const LOCALE_COOKIE = 'locale'
export const LOCALE_STORAGE_KEY = 'locale'

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(value)
  )
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE
  const base = value.toLowerCase().split('-')[0]
  return isLocale(base) ? base : DEFAULT_LOCALE
}
