import { t } from '@lingui/core/macro'
import { Users } from 'lucide-react'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function B3PrimingSocialProof() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Users className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title={t`Miles de marcas ya usan Marz`}
        subtitle={t`Conectamos marcas con creadores de contenido que generan resultados reales. Vamos a personalizar tu experiencia.`}
      />
    </div>
  )
}
