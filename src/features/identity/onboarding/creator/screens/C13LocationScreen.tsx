import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { OnboardingField } from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'
import { COUNTRIES } from '../countries'

export function C13LocationScreen() {
  const store = useCreatorOnboardingStore()

  const handleCityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('city', e.target.value || null)
    },
    [store],
  )

  return (
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Desde dónde creás?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Base geográfica. Importa para campañas con foco regional.`}
        </p>
      </div>
      <div className="flex w-full max-w-[440px] flex-col gap-5">
        <OnboardingField
          label={t`País`}
          className="max-w-none"
          error={store.fieldErrors.country}
        >
          <Select
            value={store.country ?? ''}
            onValueChange={(v) => store.setField('country', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t`Argentina`} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </OnboardingField>
        <OnboardingField label={t`Ciudad`} className="max-w-none">
          <Input
            value={store.city ?? ''}
            onChange={handleCityChange}
            placeholder={t`Buenos Aires`}
            maxLength={200}
          />
        </OnboardingField>
      </div>
    </div>
  )
}
