import { t } from '@lingui/core/macro'
import { Building2 } from 'lucide-react'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function C3PrimingBrandsWaiting() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Building2 className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title={t`Las marcas te esperan`}
        subtitle={t`Hay cientos de marcas buscando creadores como vos.`}
      />
    </div>
  )
}
