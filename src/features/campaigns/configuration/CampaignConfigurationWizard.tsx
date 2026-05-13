import { useEffect, useRef } from 'react'
import { Link, Outlet, useParams } from '@tanstack/react-router'
import { ArrowLeft, Check, Circle, CircleDot } from 'lucide-react'
import { t } from '@lingui/core/macro'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { BonusStep } from './BonusStep'
import { ContentTypeStep } from './ContentTypeStep'
import { PricingModelStep } from './PricingModelStep'
import { ReviewStep } from './ReviewStep'
import { TargetingStep } from './TargetingStep'
import {
  CAMPAIGN_CONFIGURATION_STEPS,
  isCampaignConfigurationStep,
  useCampaignConfigurationQuery,
} from './hooks'
import type { CampaignConfiguration, CampaignConfigurationStep } from './hooks'
import {
  trackCampaignConfigurationAbandoned,
  trackCampaignConfigurationStarted,
} from './analytics'
import { useConfigurationWebSocket } from './useConfigurationWebSocket'

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
}

export function CampaignConfigurationWizard({
  campaignId,
  config,
}: CampaignConfigurationWizardProps) {
  const params: { step?: string } = useParams({ strict: false })
  const configQuery = useCampaignConfigurationQuery(campaignId)
  const activeConfig = configQuery.data ?? config
  const activeConfigRef = useRef(activeConfig)
  const abandonedTrackedRef = useRef(false)
  const routeStep = params.step
  const displayStep =
    routeStep && isCampaignConfigurationStep(routeStep)
      ? routeStep
      : activeConfig.current_step
  const activeStepIndex = CAMPAIGN_CONFIGURATION_STEPS.indexOf(displayStep)
  const stepCopy = getStepCopy()
  const safeActiveStepIndex = Math.max(activeStepIndex, 0)
  const activeStep = CAMPAIGN_CONFIGURATION_STEPS[safeActiveStepIndex]!
  const activeCopy = stepCopy[activeStep]

  useConfigurationWebSocket(campaignId)

  useEffect(() => {
    activeConfigRef.current = activeConfig
  }, [activeConfig])

  useEffect(() => {
    trackCampaignConfigurationStarted(campaignId)
  }, [campaignId])

  useEffect(() => {
    abandonedTrackedRef.current = false

    function trackAbandonedOnce() {
      if (abandonedTrackedRef.current) return

      const latestConfig = activeConfigRef.current
      if (latestConfig.configuration_complete) return

      abandonedTrackedRef.current = true
      trackCampaignConfigurationAbandoned(latestConfig)
    }

    window.addEventListener('beforeunload', trackAbandonedOnce)

    return () => {
      window.removeEventListener('beforeunload', trackAbandonedOnce)
      trackAbandonedOnce()
    }
  }, [campaignId])

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
          {t`Versión ${activeConfig.configuration_version}`}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8">
          <section className="flex flex-col gap-6">
            <div className="flex items-start gap-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold text-foreground">
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
            <ConfigurationStepper config={activeConfig} />
          </section>

          <section className="flex min-h-80 flex-col justify-center">
            <Outlet />
          </section>
        </div>
      </main>
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
  const configQuery = useCampaignConfigurationQuery(config.campaign_id)
  const activeConfig = configQuery.data ?? config

  if (step === 'content_type') {
    return (
      <ContentTypeStep
        campaignId={activeConfig.campaign_id}
        config={activeConfig}
      />
    )
  }

  if (step === 'pricing_model') {
    return (
      <PricingModelStep
        campaignId={activeConfig.campaign_id}
        config={activeConfig}
      />
    )
  }

  if (step === 'targeting') {
    return (
      <TargetingStep
        campaignId={activeConfig.campaign_id}
        config={activeConfig}
      />
    )
  }

  if (step === 'bonus') {
    return (
      <BonusStep campaignId={activeConfig.campaign_id} config={activeConfig} />
    )
  }

  return (
    <ReviewStep campaignId={activeConfig.campaign_id} config={activeConfig} />
  )
}
