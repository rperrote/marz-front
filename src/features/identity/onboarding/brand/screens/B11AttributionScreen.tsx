import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import {
  OnboardingSectionTitle,
  OnboardingOptionChip,
  OnboardingField,
} from '#/features/identity/onboarding/shared/components'
import { useBrandOnboardingStore } from '../store'
import { AttributionNonReferralSource } from '#/shared/api/generated/model/attributionNonReferralSource'
import type { Attribution } from '#/shared/api/generated/model/attribution'

type AllSource = AttributionNonReferralSource | 'referral'

const SOURCES: { value: AllSource; label: () => string }[] = [
  { value: AttributionNonReferralSource.instagram, label: () => t`Instagram` },
  {
    value: AttributionNonReferralSource.twitter_x,
    label: () => t`Twitter / X`,
  },
  { value: AttributionNonReferralSource.tiktok, label: () => t`TikTok` },
  { value: AttributionNonReferralSource.linkedin, label: () => t`LinkedIn` },
  { value: AttributionNonReferralSource.reddit, label: () => t`Reddit` },
  {
    value: AttributionNonReferralSource.search,
    label: () => t`Búsqueda en Google`,
  },
  { value: 'referral' as const, label: () => t`Me lo recomendaron` },
  { value: AttributionNonReferralSource.other, label: () => t`Otro` },
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
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cómo conociste Marz?`}
        subtitle={t`Nos ayuda a mejorar cómo llegamos a más marcas.`}
      />
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <div className="flex flex-wrap justify-center gap-2">
          {SOURCES.map((s) => (
            <OnboardingOptionChip
              key={s.value}
              label={s.label()}
              role="radio"
              selected={selectedSource === s.value}
              onToggle={() => handleSelect(s.value)}
            />
          ))}
        </div>
        {isReferral && (
          <OnboardingField label={t`¿Quién te recomendó?`}>
            <Input
              value={referralText}
              onChange={handleReferralTextChange}
              placeholder={t`Nombre o empresa`}
              maxLength={2000}
              autoFocus
            />
          </OnboardingField>
        )}
      </div>
    </div>
  )
}
