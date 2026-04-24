import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import {
  OnboardingSectionTitle,
  OnboardingField,
} from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'

const E164_RE = /^\+[1-9]\d{1,14}$/

export function C15WhatsappScreen() {
  const store = useCreatorOnboardingStore()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^\d+]/g, '')
      store.setField('whatsapp_e164', val)
    },
    [store],
  )

  const value = store.whatsapp_e164 ?? ''
  const error =
    value.length > 0 && !E164_RE.test(value)
      ? t`Formato: +54911XXXXXXXX`
      : store.fieldErrors.whatsapp_e164

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`Tu WhatsApp`}
        subtitle={t`Las marcas podrán contactarte por WhatsApp para coordinar campañas.`}
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <OnboardingField
          label={t`Número de WhatsApp`}
          hint={t`Formato internacional: +54911XXXXXXXX`}
          error={error}
        >
          <Input
            type="tel"
            value={value}
            onChange={handleChange}
            placeholder="+54911..."
            maxLength={16}
            aria-invalid={!!error}
          />
        </OnboardingField>
      </div>
    </div>
  )
}
