import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Instagram, Twitter, Users, Search, Linkedin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'
import { Input } from '#/components/ui/input'
import { FieldRow } from '#/shared/ui/form'
import { useBrandOnboardingStore } from '../store'
import { AttributionNonReferralSource } from '#/shared/api/generated/model/attributionNonReferralSource'
import type { Attribution } from '#/shared/api/generated/model/attribution'

type AllSource = AttributionNonReferralSource | 'referral'

const SOURCES: {
  value: AllSource
  label: () => string
  icon?: LucideIcon
}[] = [
  {
    value: AttributionNonReferralSource.instagram,
    label: () => t`Instagram`,
    icon: Instagram,
  },
  {
    value: AttributionNonReferralSource.twitter_x,
    label: () => t`X / Twitter`,
    icon: Twitter,
  },
  { value: 'referral' as const, label: () => t`Referido`, icon: Users },
  {
    value: AttributionNonReferralSource.search,
    label: () => t`Búsqueda`,
    icon: Search,
  },
  { value: AttributionNonReferralSource.other, label: () => t`Otro` },
  { value: AttributionNonReferralSource.tiktok, label: () => t`TikTok` },
  {
    value: AttributionNonReferralSource.linkedin,
    label: () => t`LinkedIn`,
    icon: Linkedin,
  },
  { value: AttributionNonReferralSource.reddit, label: () => t`Reddit` },
]

function getSelectedSource(attr: Attribution | undefined): AllSource | null {
  if (!attr || !('source' in attr)) return null
  return attr.source as AllSource
}

export function B11AttributionScreen() {
  const store = useBrandOnboardingStore()
  const selectedSource = getSelectedSource(store.attribution)
  const isReferral = selectedSource === 'referral'
  const referralText =
    store.attribution && 'referral_text' in store.attribution
      ? store.attribution.referral_text
      : ''

  const handleSelect = useCallback(
    (source: AllSource) => {
      if (source === 'referral') {
        store.setField('attribution', {
          source: 'referral',
          referral_text: referralText,
        })
      } else {
        store.setField('attribution', { source })
      }
    },
    [store, referralText],
  )

  const handleReferralTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('attribution', {
        source: 'referral',
        referral_text: e.target.value,
      })
    },
    [store],
  )

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[600px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Cómo llegaste a Marz?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Nos ayuda a entender qué funciona.`}
        </p>
      </div>

      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <div
          className="flex flex-wrap justify-center gap-2.5"
          role="radiogroup"
          aria-label={t`Fuente`}
        >
          {SOURCES.map((s) => {
            const selected = selectedSource === s.value
            const Icon = s.icon
            return (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => handleSelect(s.value)}
                className={cn(
                  'flex h-11 items-center gap-2 rounded-full px-5 text-xs transition-colors',
                  selected
                    ? 'border-2 border-primary bg-primary/10 font-semibold text-primary'
                    : 'border border-border bg-card font-medium text-foreground hover:bg-surface-hover',
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      'size-4',
                      selected ? 'text-primary' : 'text-foreground',
                    )}
                  />
                )}
                {s.label()}
              </button>
            )
          })}
        </div>

        {isReferral && (
          <FieldRow label={t`¿Quién te recomendó Marz?`}>
            {(aria) => (
              <Input
                {...aria}
                value={referralText}
                onChange={handleReferralTextChange}
                placeholder={t`Nombre o handle de quien te pasó el dato`}
                maxLength={2000}
                autoFocus
              />
            )}
          </FieldRow>
        )}
      </div>
    </div>
  )
}
