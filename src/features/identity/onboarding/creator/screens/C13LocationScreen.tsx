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
import {
  OnboardingSectionTitle,
  OnboardingField,
} from '#/features/identity/onboarding/shared/components'
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
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Dónde estás?`}
        subtitle={t`Tu ubicación ayuda a las marcas a encontrarte para campañas locales.`}
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <OnboardingField label={t`País`} error={store.fieldErrors.country}>
          <Select
            value={store.country ?? ''}
            onValueChange={(v) => store.setField('country', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t`Seleccioná un país`} />
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
        <OnboardingField label={t`Ciudad`} hint={t`Opcional`}>
          <Input
            value={store.city ?? ''}
            onChange={handleCityChange}
            placeholder={t`Tu ciudad`}
            maxLength={200}
          />
        </OnboardingField>
      </div>
    </div>
  )
}
