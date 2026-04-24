import { PartyPopper } from 'lucide-react'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function C20ConfirmationScreen() {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <PartyPopper className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title="¡Todo listo!"
        subtitle="Tu perfil de creator está configurado. Es hora de recibir ofertas."
      />
    </div>
  )
}
