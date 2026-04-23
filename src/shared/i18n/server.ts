import { createServerFn } from '@tanstack/react-start'
import {
  getCookie,
  getRequestHeader,
  setCookie,
} from '@tanstack/react-start/server'

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  isLocale,
  normalizeLocale,
} from './config'
import type { Locale } from './config'

function parseAcceptLanguage(header: string | undefined): Locale | null {
  if (!header) return null
  const tags = header
    .split(',')
    .map((part) => {
      const [tag, qStr] = part.trim().split(';q=')
      if (!tag) return null
      const q = qStr ? Number.parseFloat(qStr) : 1
      return { tag: tag.toLowerCase(), q: Number.isNaN(q) ? 1 : q }
    })
    .filter((entry): entry is { tag: string; q: number } => entry !== null)
    .sort((a, b) => b.q - a.q)

  for (const { tag } of tags) {
    const normalized = normalizeLocale(tag)
    if (normalized !== DEFAULT_LOCALE || tag.startsWith(DEFAULT_LOCALE)) {
      return normalized
    }
  }
  return null
}

export const resolveLocale = createServerFn({ method: 'GET' }).handler(() => {
  const cookieLocale = getCookie(LOCALE_COOKIE)
  if (isLocale(cookieLocale)) return cookieLocale

  const accept = getRequestHeader('accept-language')
  const detected = parseAcceptLanguage(accept)
  return detected ?? DEFAULT_LOCALE
})

export const persistLocale = createServerFn({ method: 'POST' })
  .inputValidator((value: unknown): Locale => {
    if (!isLocale(value)) {
      throw new Error(
        `Invalid locale. Expected one of: ${SUPPORTED_LOCALES.join(', ')}`,
      )
    }
    return value
  })
  .handler(({ data }) => {
    setCookie(LOCALE_COOKIE, data, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return { locale: data }
  })
