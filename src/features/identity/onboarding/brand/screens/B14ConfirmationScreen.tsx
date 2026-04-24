import { t } from '@lingui/core/macro'
import { PartyPopper } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'

export function B14ConfirmationScreen() {
  // B14: "Empezar" triggers fn-1.15 (completeBrandOnboarding).
  // The layout's onNext handles navigation; this screen just renders the CTA.
  // fn-1.15 will wire up the actual submission.
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <PartyPopper className="size-8 text-primary" />
      </div>
      <OnboardingSectionTitle
        title={t`¡Todo listo!`}
        subtitle={t`Tu workspace está configurado. Es hora de encontrar los creators perfectos para tu marca.`}
      />
      <Button
        size="lg"
        className="min-w-[200px]"
        data-testid="onboarding-start-btn"
      >
        {t`Empezar`}
      </Button>
    </div>
  )
}
