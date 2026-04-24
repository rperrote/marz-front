import { t } from '@lingui/core/macro'
import { Users } from 'lucide-react'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function C19PrimingSocialProof() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Users className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title={t`Comunidad de creators`}
        subtitle={t`Unite a miles de creadores que ya monetizan su contenido en Marz.`}
      />
    </div>
  )
}
