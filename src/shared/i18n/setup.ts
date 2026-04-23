import { i18n } from '@lingui/core'

import { DEFAULT_LOCALE, isLocale } from './config'
import type { Locale } from './config'

type Messages = Record<string, string>

const loaders: Record<Locale, () => Promise<{ messages: Messages }>> = {
  es: () => import('./locales/es/messages.po'),
  en: () => import('./locales/en/messages.po'),
}

export async function loadCatalog(locale: Locale): Promise<void> {
  const target = isLocale(locale) ? locale : DEFAULT_LOCALE
  const loader = loaders[target]
  const { messages } = await loader()
  i18n.loadAndActivate({ locale: target, messages })
}

export { i18n }
