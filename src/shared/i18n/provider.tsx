import { I18nProvider } from '@lingui/react'
import { useEffect, useState, createContext, useContext  } from 'react'

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  
  isLocale
} from './config'
import type {Locale} from './config';
import { i18n, loadCatalog } from './setup'
import { persistLocale } from './server'


type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<I18nContextValue | null>(null)

export function useLocale(): I18nContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside <AppI18nProvider>')
  return ctx
}

type AppI18nProviderProps = {
  initialLocale: Locale
  children: React.ReactNode
}

export function AppI18nProvider({
  initialLocale,
  children,
}: AppI18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

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
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    </LocaleContext.Provider>
  )
}

export { DEFAULT_LOCALE }
