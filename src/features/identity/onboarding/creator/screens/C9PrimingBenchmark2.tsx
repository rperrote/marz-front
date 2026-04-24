import { t } from '@lingui/core/macro'
import { BarChart3 } from 'lucide-react'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function C9PrimingBenchmark2() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <BarChart3 className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title={t`Tu potencial`}
        subtitle={t`Basado en tu perfil, esto es lo que podrías lograr.`}
      />
    </div>
  )
}
