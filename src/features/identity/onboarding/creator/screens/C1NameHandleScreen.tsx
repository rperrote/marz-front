import { useCallback } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import { OnboardingField } from '#/features/identity/onboarding/shared/components'
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
    <div className="flex w-full flex-col items-center gap-9">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-2.5">
        <h1 className="text-center text-[28px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {t`¿Cómo te conocen?`}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t`Tu nombre público y tu handle principal.`}
        </p>
      </div>

      <div className="flex w-full max-w-[460px] flex-col gap-5">
        <OnboardingField
          label={t`Nombre público`}
          className="max-w-none"
          error={store.fieldErrors.display_name}
        >
          <Input
            value={store.display_name ?? ''}
            onChange={handleNameChange}
            placeholder={t`Lucas Romero`}
            maxLength={200}
          />
        </OnboardingField>
        <OnboardingField
          label={t`Handle principal`}
          className="max-w-none"
          error={handleError}
        >
          <Input
            value={handle}
            onChange={handleHandleChange}
            placeholder="@lucasromero"
            maxLength={30}
            aria-invalid={!!handleError}
          />
        </OnboardingField>
      </div>
    </div>
  )
}
