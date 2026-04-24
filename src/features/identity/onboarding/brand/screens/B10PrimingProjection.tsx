import { t } from '@lingui/core/macro'
import { TrendingUp } from 'lucide-react'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function B10PrimingProjection() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <TrendingUp className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title={t`Estás a punto de terminar`}
        subtitle={t`Con tus datos vamos a armar proyecciones personalizadas de alcance y resultados para tu marca.`}
      />
    </div>
  )
}
