import { t } from '@lingui/core/macro'
import { DollarSign } from 'lucide-react'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function C18PrimingEarnings() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <DollarSign className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title={t`Empezá a ganar`}
        subtitle={t`Tu perfil está casi listo. Las marcas van a poder encontrarte y hacerte ofertas.`}
      />
    </div>
  )
}
