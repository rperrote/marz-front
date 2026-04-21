import { useLocale } from '#/shared/i18n/provider'
import { SUPPORTED_LOCALES  } from '#/shared/i18n/config'
import type {Locale} from '#/shared/i18n/config';

const LABELS: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
}

export function LocaleToggle() {
  const { locale, setLocale } = useLocale()

  function cycle() {
    const idx = SUPPORTED_LOCALES.indexOf(locale)
    const next = SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length]
    if (next) setLocale(next)
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Language: ${locale}. Click to switch.`}
      title={`Language: ${locale}`}
      className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface-hover"
    >
      {LABELS[locale]}
    </button>
  )
}

export default LocaleToggle
