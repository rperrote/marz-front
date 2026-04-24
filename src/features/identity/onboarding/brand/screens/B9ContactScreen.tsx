import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import { OnboardingField } from '#/features/identity/onboarding/shared/components'
import { useBrandOnboardingStore } from '../store'

function formatE164(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, '')
  if (!digits.startsWith('+') && digits.length > 0) {
    digits = '+' + digits
  }
  return digits
}

export function B9ContactScreen() {
  const store = useBrandOnboardingStore()

  const handleWhatsAppChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatE164(e.target.value)
      store.setField('contact_whatsapp_e164', formatted)
    },
    [store],
  )

  const whatsapp = store.contact_whatsapp_e164 ?? ''
  const whatsappValid =
    whatsapp.length === 0 || /^\+[1-9]\d{7,14}$/.test(whatsapp)

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`Último paso antes del match`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Lo usamos para coordinar arranque. Nada de spam.`}
        </p>
      </div>

      <div className="flex w-full max-w-[560px] flex-col gap-5">
        <div className="flex w-full gap-4">
          <OnboardingField label={t`Nombre`} className="max-w-none flex-1">
            <Input
              value={store.contact_name ?? ''}
              onChange={(e) => store.setField('contact_name', e.target.value)}
              placeholder={t`María`}
              maxLength={200}
            />
          </OnboardingField>
          <OnboardingField label={t`Cargo`} className="max-w-none flex-1">
            <Input
              value={store.contact_title ?? ''}
              onChange={(e) => store.setField('contact_title', e.target.value)}
              placeholder={t`Growth Lead`}
              maxLength={200}
            />
          </OnboardingField>
        </div>
        <OnboardingField
          label={t`WhatsApp`}
          className="max-w-none"
          error={
            !whatsappValid ? t`Formato inválido. Usá formato E.164.` : undefined
          }
        >
          <Input
            value={whatsapp}
            onChange={handleWhatsAppChange}
            placeholder="+54 11 5555-5555"
            type="tel"
            maxLength={16}
            aria-invalid={!whatsappValid}
          />
        </OnboardingField>
      </div>
    </div>
  )
}
