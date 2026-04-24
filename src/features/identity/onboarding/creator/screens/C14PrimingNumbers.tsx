import { t } from '@lingui/core/macro'
import { Hash } from 'lucide-react'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function C14PrimingNumbers() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Hash className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title={t`Los números importan`}
        subtitle={t`Completá los últimos datos para que podamos conectarte con las marcas ideales.`}
      />
    </div>
  )
}
