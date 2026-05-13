import { I18nProvider } from '@lingui/react'
import { useEffect, useState, createContext, use } from 'react'

import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale } from './config'
import type { Locale } from './config'
import { activateCatalog, i18n, loadCatalog } from './setup'
import type { Messages } from './setup'
import { persistLocale } from './server'

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<I18nContextValue | null>(null)

export function useLocale(): I18nContextValue {
  const ctx = use(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside <AppI18nProvider>')
  return ctx
}

type AppI18nProviderProps = {
  initialLocale: Locale
  initialMessages: Messages
  children: React.ReactNode
}

export function AppI18nProvider({
  initialLocale,
  initialMessages,
  children,
}: AppI18nProviderProps) {
  // Activate synchronously during render so child components calling t``
  // never see an empty catalog. useState's initializer fires once but a
  // streaming SSR boundary can re-render the provider before children
  // hydrate, leaving them without a locale. Re-activating here is a no-op
  // when the catalog is already loaded.
  if (i18n.locale !== initialLocale) {
    activateCatalog(initialLocale, initialMessages)
  }

  const [locale, setLocaleState] = useState<Locale>(() =>
    isLocale(i18n.locale) ? i18n.locale : initialLocale,
  )

  useEffect(() => {
    if (i18n.locale !== locale) void loadCatalog(locale)
  }, [locale])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  function setLocale(next: Locale) {
    if (!isLocale(next) || next === locale) return
    setLocaleState(next)
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {}
    void persistLocale({ data: next })
  }

  return (
    <LocaleContext value={{ locale, setLocale }}>
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    </LocaleContext>
  )
}

export { DEFAULT_LOCALE }
