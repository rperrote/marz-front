import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import { FieldRow } from '#/shared/ui/form'
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
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`Un WhatsApp al que llegarte`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Solo para avisar cuando una marca te acepta. Sin spam.`}
        </p>
      </div>
      <div className="flex w-full max-w-[440px] flex-col gap-5">
        <FieldRow label={t`WhatsApp`} error={error}>
          {(aria) => (
            <Input
              {...aria}
              type="tel"
              value={value}
              onChange={handleChange}
              placeholder="+54 11 5555-5555"
              maxLength={16}
            />
          )}
        </FieldRow>
      </div>
    </div>
  )
}
