import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import {
  OnboardingSectionTitle,
  OnboardingField,
} from '#/features/identity/onboarding/shared/components'
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
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Quién será el contacto principal?`}
        subtitle={t`Datos de la persona que va a gestionar las campañas.`}
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <OnboardingField label={t`Nombre completo`}>
          <Input
            value={store.contact_name ?? ''}
            onChange={(e) => store.setField('contact_name', e.target.value)}
            placeholder={t`Juan Pérez`}
            maxLength={200}
          />
        </OnboardingField>
        <OnboardingField label={t`Cargo`}>
          <Input
            value={store.contact_title ?? ''}
            onChange={(e) => store.setField('contact_title', e.target.value)}
            placeholder={t`Marketing Manager`}
            maxLength={200}
          />
        </OnboardingField>
        <OnboardingField
          label={t`WhatsApp`}
          hint={t`Formato internacional, ej: +5491155551234`}
          error={
            !whatsappValid ? t`Formato inválido. Usá formato E.164.` : undefined
          }
        >
          <Input
            value={whatsapp}
            onChange={handleWhatsAppChange}
            placeholder="+5491155551234"
            type="tel"
            maxLength={16}
            aria-invalid={!whatsappValid}
          />
        </OnboardingField>
      </div>
    </div>
  )
}
