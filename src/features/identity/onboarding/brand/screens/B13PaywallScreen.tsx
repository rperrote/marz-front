import { t } from '@lingui/core/macro'
import { Crown, Check } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'
import { useNavigate } from '@tanstack/react-router'
import { useBrandOnboardingStore } from '../store'
import { STEPS, getStepId } from '../steps'

const FEATURES = [
  () => t`Acceso ilimitado a creators verificados`,
  () => t`Campañas sin límite`,
  () => t`Analytics avanzados`,
  () => t`Soporte prioritario`,
]

export function B13PaywallScreen() {
  const navigate = useNavigate()
  const store = useBrandOnboardingStore()

  const handleSkip = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === 'paywall')
    if (currentIndex >= 0 && currentIndex < STEPS.length - 1) {
      const nextIndex = currentIndex + 1
      store.goTo(nextIndex)
      void navigate({
        to: '/onboarding/brand/$step',
        params: { step: getStepId(nextIndex) },
      })
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`Potenciá tu marca con Marz Pro`}
        subtitle={t`Desbloqueá todas las herramientas para escalar tus campañas.`}
      />
      <div className="flex w-full max-w-[400px] flex-col gap-6 rounded-2xl border border-border bg-card p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Crown className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-[length:var(--font-size-lg)] font-bold text-foreground">
              {t`Plan Pro`}
            </p>
            <p className="text-[length:var(--font-size-sm)] text-muted-foreground">
              {t`14 días gratis`}
            </p>
          </div>
        </div>
        <ul className="flex flex-col gap-3">
          {FEATURES.map((feature, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-[length:var(--font-size-sm)] text-foreground"
            >
              <Check className="size-4 text-primary" />
              {feature()}
            </li>
          ))}
        </ul>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button disabled className="w-full">
                  {t`Start trial`}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t`Próximamente`}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <button
        type="button"
        onClick={handleSkip}
        className="text-[length:var(--font-size-sm)] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        {t`Continuar sin suscribirme`}
      </button>
    </div>
  )
}
