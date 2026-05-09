import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  CircleDot,
  Loader2,
} from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { CAMPAIGN_CONFIGURATION_STEPS } from './hooks'
import type { CampaignConfiguration, CampaignConfigurationStep } from './hooks'

function getStepCopy(): Record<
  CampaignConfigurationStep,
  {
    title: string
    description: string
    shortLabel: string
    todoLabel: string
  }
> {
  return {
    content_type: {
      title: t`¿Qué tipo de campaña vas a correr?`,
      description: t`Definí cómo creators van a entregar el contenido para tu marca.`,
      shortLabel: t`Contenido`,
      todoLabel: t`tipo de contenido`,
    },
    pricing_model: {
      title: t`Definí el modelo de pago`,
      description: t`Elegí cómo vas a compensar cada entrega aprobada.`,
      shortLabel: t`Pago`,
      todoLabel: t`modelo de pago`,
    },
    targeting: {
      title: t`Ajustá el targeting operativo`,
      description: t`Revisá qué creators califican para esta campaña.`,
      shortLabel: t`Targeting`,
      todoLabel: t`targeting`,
    },
    bonus: {
      title: t`Configurá los bonos`,
      description: t`Sumá incentivos por velocidad o performance si aplican.`,
      shortLabel: t`Bonos`,
      todoLabel: t`bonos`,
    },
    review: {
      title: t`Revisá y activá la campaña`,
      description: t`Confirmá la configuración antes de publicar la campaña.`,
      shortLabel: t`Review`,
      todoLabel: t`review`,
    },
  }
}

interface CampaignConfigurationWizardProps {
  campaignId: string
  config: CampaignConfiguration
  from?: 'brief-builder' | 'campaign-list'
}

export function CampaignConfigurationWizard({
  campaignId,
  config,
  from,
}: CampaignConfigurationWizardProps) {
  const navigate = useNavigate()
  const activeStepIndex = CAMPAIGN_CONFIGURATION_STEPS.indexOf(
    config.current_step,
  )
  const stepCopy = getStepCopy()
  const safeActiveStepIndex = Math.max(activeStepIndex, 0)
  const activeStep = CAMPAIGN_CONFIGURATION_STEPS[safeActiveStepIndex]!
  const activeCopy = stepCopy[activeStep]
  const previousStep = CAMPAIGN_CONFIGURATION_STEPS[safeActiveStepIndex - 1]
  const nextStep = CAMPAIGN_CONFIGURATION_STEPS[safeActiveStepIndex + 1]
  const backLabel =
    from === 'brief-builder' ? t`Volver al brief` : t`Volver a campañas`

  const goToStep = (step: CampaignConfigurationStep) => {
    void navigate({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step },
      search: from ? { from } : {},
    })
  }

  const handleBack = () => {
    if (previousStep) {
      goToStep(previousStep)
      return
    }

    if (from === 'brief-builder') {
      void navigate({
        to: '/campaigns/$campaignId/brief',
        params: { campaignId },
      })
      return
    }

    void navigate({ to: '/campaigns' })
  }

  const handleNext = () => {
    if (nextStep) {
      goToStep(nextStep)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/campaigns">
            <ArrowLeft className="size-4" />
            {t`Campañas`}
          </Link>
        </Button>
        <div className="h-4 w-px bg-border" />
        <p className="text-sm font-medium text-foreground">
          {t`Configurar campaña`}
        </p>
        <div className="ml-auto rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
          {t`Versión ${config.configuration_version}`}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-8 py-8">
          <section className="flex flex-col gap-6">
            <div className="flex items-start gap-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {activeCopy.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {activeCopy.description}
                </p>
              </div>
              <p className="shrink-0 font-mono text-xs tracking-widest text-muted-foreground uppercase">
                {t`Paso ${safeActiveStepIndex + 1} de ${CAMPAIGN_CONFIGURATION_STEPS.length}`}
              </p>
            </div>
            <ConfigurationStepper config={config} />
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <Outlet />
          </section>
        </div>
      </main>

      <footer className="shrink-0 border-t border-border bg-background px-8 py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Button>
          <div className="flex-1" />
          <Button
            className="rounded-full"
            onClick={handleNext}
            disabled={!nextStep}
          >
            {nextStep ? t`Continuar` : t`Activar campaña`}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </footer>
    </div>
  )
}

interface ConfigurationStepperProps {
  config: CampaignConfiguration
}

export function ConfigurationStepper({ config }: ConfigurationStepperProps) {
  const completedSteps = new Set(config.completed_steps)

  return (
    <ol
      className="grid grid-cols-5 gap-3"
      aria-label={t`Pasos de configuración`}
    >
      {CAMPAIGN_CONFIGURATION_STEPS.map((step, index) => {
        const state = completedSteps.has(step)
          ? 'completed'
          : step === config.current_step
            ? 'current'
            : 'upcoming'

        return (
          <li key={step}>
            <StepperItem step={step} index={index} state={state} />
          </li>
        )
      })}
    </ol>
  )
}

interface StepperItemProps {
  step: CampaignConfigurationStep
  index: number
  state: 'completed' | 'current' | 'upcoming'
}

function StepperItem({ step, index, state }: StepperItemProps) {
  const stepCopy = getStepCopy()
  const copy = stepCopy[step]
  const Icon =
    state === 'completed' ? Check : state === 'current' ? CircleDot : Circle

  return (
    <div
      className={cn(
        'flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3',
        state === 'current' &&
          'border-primary bg-primary/10 text-foreground shadow-sm',
        state === 'completed' && 'border-primary/40 bg-card text-foreground',
        state === 'upcoming' &&
          'border-border bg-muted/40 text-muted-foreground',
      )}
      aria-current={state === 'current' ? 'step' : undefined}
      data-state={state}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border',
          state === 'current' &&
            'border-primary bg-primary text-primary-foreground',
          state === 'completed' && 'border-primary bg-primary/15 text-primary',
          state === 'upcoming' && 'border-border text-muted-foreground',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[11px] text-muted-foreground">
          {t`Paso ${index + 1}`}
        </span>
        <span className="block truncate text-sm font-semibold">
          {copy.shortLabel}
        </span>
      </span>
    </div>
  )
}

interface CampaignConfigurationStepSlotProps {
  config: CampaignConfiguration
  step: CampaignConfigurationStep
}

export function CampaignConfigurationStepSlot({
  config,
  step,
}: CampaignConfigurationStepSlotProps) {
  const stepCopy = getStepCopy()
  const copy = stepCopy[step]

  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Loader2 className="size-5" aria-hidden="true" />
      </div>
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-foreground">
          {t`TODO step ${copy.todoLabel}`}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t`Este slot ya recibe la configuración de la campaña ${config.campaign_id} y queda listo para implementar el formulario real.`}
        </p>
      </div>
    </div>
  )
}
