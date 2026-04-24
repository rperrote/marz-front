import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import {
  OnboardingSectionTitle,
  OnboardingField,
} from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'

export function C11BirthdayScreen() {
  const store = useCreatorOnboardingStore()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('birthday', e.target.value)
    },
    [store],
  )

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cuándo naciste?`}
        subtitle={t`Usamos esta info para métricas demográficas — no es pública.`}
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <OnboardingField
          label={t`Fecha de nacimiento`}
          error={store.fieldErrors.birthday}
        >
          <Input
            type="date"
            value={store.birthday ?? ''}
            onChange={handleChange}
          />
        </OnboardingField>
      </div>
    </div>
  )
}
