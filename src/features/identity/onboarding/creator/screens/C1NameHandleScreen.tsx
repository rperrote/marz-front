import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import {
  OnboardingSectionTitle,
  OnboardingField,
} from '#/features/identity/onboarding/shared/components'
import { useCreatorOnboardingStore } from '../store'

const HANDLE_RE = /^[a-z0-9_]{3,30}$/

export function C1NameHandleScreen() {
  const store = useCreatorOnboardingStore()

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('display_name', e.target.value)
    },
    [store],
  )

  const handleHandleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField(
        'handle',
        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      )
    },
    [store],
  )

  const handle = store.handle ?? ''
  const handleError =
    handle.length > 0 && !HANDLE_RE.test(handle)
      ? t`Entre 3 y 30 caracteres: letras, números y guion bajo.`
      : store.fieldErrors.handle

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`¿Cómo te llamás?`}
        subtitle={t`Elegí tu nombre y tu handle para que las marcas te encuentren.`}
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <OnboardingField
          label={t`Nombre`}
          error={store.fieldErrors.display_name}
        >
          <Input
            value={store.display_name ?? ''}
            onChange={handleNameChange}
            placeholder={t`Tu nombre o nombre artístico`}
            maxLength={200}
          />
        </OnboardingField>
        <OnboardingField
          label={t`Handle`}
          hint={t`marz.co/@${handle || '...'}`}
          error={handleError}
        >
          <Input
            value={handle}
            onChange={handleHandleChange}
            placeholder="tu_handle"
            maxLength={30}
            aria-invalid={!!handleError}
          />
        </OnboardingField>
      </div>
    </div>
  )
}
