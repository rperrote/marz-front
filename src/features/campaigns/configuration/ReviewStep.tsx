import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  Banknote,
  FileText,
  Film,
  Loader2,
  Rocket,
  Sparkles,
  Target,
} from 'lucide-react'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { getActiveCampaignsQueryKey } from '#/shared/api/activeCampaigns'
import { ApiError } from '#/shared/api/mutator'
import { CREATOR_TIER_OPTIONS } from './components/TierMultiSelect'
import { ReviewBlock, ReviewBlockAction } from './components/ReviewBlock'
import { trackCampaignConfigurationActivated } from './analytics'
import {
  campaignConfigurationQueryKey,
  campaignDetailSearchDefaults,
  isCampaignConfigurationStep,
  useActivateCampaignConfigurationMutation,
} from './hooks'
import type { CampaignConfiguration, CampaignConfigurationStep } from './hooks'

type ActivationErrorAction =
  | { type: 'reload_latest' }
  | { type: 'redirect_to_step'; step: CampaignConfigurationStep }
  | { type: 'generic_error' }

interface ReviewStepProps {
  campaignId: string
  config: CampaignConfiguration
}

interface ReviewItem {
  label: string
  value: string
}

const CONTENT_TYPE_LABELS: Record<
  NonNullable<CampaignConfiguration['content_type']>,
  () => string
> = {
  influencer_posts: () => t`Influencer Posts`,
  ugc_videos: () => t`UGC Videos`,
}

const PRICING_MODEL_LABELS: Record<
  NonNullable<CampaignConfiguration['pricing_model']>,
  () => string
> = {
  fixed_per_video: () => t`Fixed per video`,
  per_views: () => t`Precio por views`,
}

const OBJECTIVE_LABELS: Record<
  CampaignConfiguration['brief_summary']['objective'],
  () => string
> = {
  brand_awareness: () => t`Brand Awareness`,
  conversion: () => t`Conversión`,
  engagement: () => t`Engagement`,
  reach: () => t`Alcance`,
}

const tierLabels = new Map(
  CREATOR_TIER_OPTIONS.map((option) => [option.value, option.label] as const),
)

export function getActivationErrorAction(
  error: unknown,
): ActivationErrorAction {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return { type: 'generic_error' }
  }

  if (error.code === 'configuration_version_conflict') {
    return { type: 'reload_latest' }
  }

  if (error.code === 'configuration_incomplete') {
    const currentStep = getCurrentStepFromError(error)
    return {
      type: 'redirect_to_step',
      step: currentStep ?? 'content_type',
    }
  }

  return { type: 'generic_error' }
}

function getCurrentStepFromError(
  error: ApiError,
): CampaignConfigurationStep | null {
  const bodyStep = readCurrentStep(error.body)
  if (bodyStep) return bodyStep

  const details = error.details
  const fieldErrors = details?.field_errors
  const currentStep = fieldErrors?.current_step?.[0]

  if (currentStep && isCampaignConfigurationStep(currentStep)) {
    return currentStep
  }

  return null
}

function readCurrentStep(body: unknown): CampaignConfigurationStep | null {
  if (!body || typeof body !== 'object' || !('current_step' in body)) {
    return null
  }

  const currentStep = body.current_step
  return typeof currentStep === 'string' &&
    isCampaignConfigurationStep(currentStep)
    ? currentStep
    : null
}

export function ReviewStep({ campaignId, config }: ReviewStepProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activateMutation = useActivateCampaignConfigurationMutation()
  const [showConflictBanner, setShowConflictBanner] = useState(false)

  function navigateToStep(step: CampaignConfigurationStep) {
    void navigate({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step },
      search: campaignDetailSearchDefaults,
    })
  }

  function handleActivate() {
    if (!config.configuration_complete) return

    setShowConflictBanner(false)
    activateMutation.mutate(
      {
        campaignId,
        configuration_version: config.configuration_version,
      },
      {
        onSuccess: () => {
          trackCampaignConfigurationActivated(config)
          const activeCampaignsQueryKey = getActiveCampaignsQueryKey()

          void queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey.some(
                (part) =>
                  typeof part === 'string' && part.startsWith('/v1/campaigns'),
              ) || query.queryKey[0] === activeCampaignsQueryKey[0],
          })
          toast.success(t`Campaña activada.`)
          void navigate({
            to: '/campaigns/$campaignId',
            params: { campaignId },
            search: campaignDetailSearchDefaults,
          })
        },
        onError: (error) => {
          const action = getActivationErrorAction(error)

          if (action.type === 'reload_latest') {
            setShowConflictBanner(true)
            void queryClient.invalidateQueries({
              queryKey: campaignConfigurationQueryKey(campaignId),
            })
            return
          }

          if (action.type === 'redirect_to_step') {
            navigateToStep(action.step)
            return
          }

          toast.error(t`No se pudo activar la campaña. Intentá de nuevo.`)
        },
      },
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4">
      {showConflictBanner ? (
        <div className="rounded-2xl border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {t`La configuración cambió, revisá los datos actualizados.`}
        </div>
      ) : null}

      <ReviewBlock
        title={t`Tipo de contenido`}
        Icon={Film}
        action={
          <ReviewBlockAction onClick={() => navigateToStep('content_type')}>
            {t`Editar`}
          </ReviewBlockAction>
        }
      >
        <ReviewItems
          items={[
            {
              label: t`Formato`,
              value: config.content_type
                ? CONTENT_TYPE_LABELS[config.content_type]()
                : t`Sin definir`,
            },
          ]}
        />
      </ReviewBlock>

      <ReviewBlock
        title={t`Pricing`}
        Icon={Banknote}
        action={
          <ReviewBlockAction onClick={() => navigateToStep('pricing_model')}>
            {t`Editar`}
          </ReviewBlockAction>
        }
      >
        <ReviewItems
          items={[
            {
              label: t`Modelo`,
              value: config.pricing_model
                ? PRICING_MODEL_LABELS[config.pricing_model]()
                : t`Sin definir`,
            },
          ]}
        />
      </ReviewBlock>

      <ReviewBlock
        title={t`Targeting`}
        Icon={Target}
        action={
          <ReviewBlockAction onClick={() => navigateToStep('targeting')}>
            {t`Editar`}
          </ReviewBlockAction>
        }
      >
        <ReviewItems items={buildTargetingItems(config)} />
      </ReviewBlock>

      <ReviewBlock
        title={t`Bonus`}
        Icon={Sparkles}
        action={
          <ReviewBlockAction onClick={() => navigateToStep('bonus')}>
            {t`Editar`}
          </ReviewBlockAction>
        }
      >
        <BonusSummary config={config} />
      </ReviewBlock>

      <ReviewBlock
        title={t`Brief`}
        Icon={FileText}
        action={
          <ReviewBlockAction
            onClick={() =>
              void navigate({
                to: '/campaigns/$campaignId/brief',
                params: { campaignId },
                search: campaignDetailSearchDefaults,
              })
            }
          >
            {t`Ver brief`}
          </ReviewBlockAction>
        }
      >
        <p className="pb-8 text-sm leading-6 text-foreground">
          {buildBriefSummary(config)}
        </p>
      </ReviewBlock>

      <div className="flex flex-col gap-3 pt-2">
        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-full text-base font-semibold"
          disabled={
            !config.configuration_complete || activateMutation.isPending
          }
          onClick={handleActivate}
        >
          {activateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Rocket className="size-4" aria-hidden="true" />
          )}
          {t`Activar campaña`}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-full"
          onClick={() => navigateToStep('bonus')}
        >
          {t`Atrás`}
        </Button>
      </div>
    </div>
  )
}

function ReviewItems({ items }: { items: ReviewItem[] }) {
  return (
    <dl className="flex flex-col gap-2 pb-8">
      {items.map((item) => (
        <div key={item.label} className="grid gap-2 sm:grid-cols-[10rem_1fr]">
          <dt className="text-xs font-medium text-muted-foreground">
            {item.label}
          </dt>
          <dd className="text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function buildTargetingItems(config: CampaignConfiguration): ReviewItem[] {
  const targeting = config.operational_targeting

  return [
    {
      label: t`Países`,
      value:
        targeting.countries.length > 0
          ? t`${targeting.countries.length} seleccionados`
          : t`Sin países`,
    },
    {
      label: t`Tier`,
      value:
        targeting.tiers.length > 0
          ? targeting.tiers.map(formatTier).join(' · ')
          : t`Sin tiers`,
    },
    {
      label: t`Seguidores`,
      value: formatRange(targeting.follower_min, targeting.follower_max),
    },
    {
      label: t`Edad`,
      value: formatAgeRange(targeting.age_min, targeting.age_max),
    },
  ]
}

function BonusSummary({ config }: { config: CampaignConfiguration }) {
  const speedWindows = config.bonus_config.speed_bonus.windows
  const performanceMilestones = config.bonus_config.performance_bonus.milestones

  if (
    !config.bonus_config.enabled ||
    (speedWindows.length === 0 && performanceMilestones.length === 0)
  ) {
    return <p className="pb-8 text-sm text-muted-foreground">{t`Sin bonus`}</p>
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {speedWindows.length > 0 ? (
        <BonusGroup
          title={t`Speed Bonus`}
          items={speedWindows.map(
            (window) =>
              t`≤ ${window.window_hours} hs · ${formatBonusAmount(window.bonus)}`,
          )}
        />
      ) : null}
      {performanceMilestones.length > 0 ? (
        <BonusGroup
          title={t`Performance Bonus`}
          items={performanceMilestones.map(
            (milestone) =>
              t`${formatNumber(milestone.views)} views en ${formatHours(milestone.window_hours)} · ${formatBonusAmount(milestone.bonus)}`,
          )}
        />
      ) : null}
    </div>
  )
}

function BonusGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="font-mono text-xs text-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function buildBriefSummary(config: CampaignConfiguration) {
  const brief = config.brief_summary
  return t`${OBJECTIVE_LABELS[brief.objective]()} — ${brief.scoring_dimensions_count} dimensiones de scoring · ${brief.hard_filters_count} hard filters · ${brief.disqualifiers_count} descalificadores`
}

function formatTier(
  tier: CampaignConfiguration['operational_targeting']['tiers'][number],
) {
  return tierLabels.get(tier)?.() ?? tier
}

function formatRange(min: number | null, max: number | null) {
  if (min == null && max == null) return t`Sin rango`
  if (min == null) {
    return max == null ? t`Sin rango` : t`Hasta ${formatNumber(max)}`
  }
  if (max == null) return t`Desde ${formatNumber(min)}`
  return t`${formatNumber(min)} – ${formatNumber(max)}`
}

function formatAgeRange(min: number | null, max: number | null) {
  if (min == null && max == null) return t`Sin rango`
  if (min == null) return max == null ? t`Sin rango` : t`Hasta ${max} años`
  if (max == null) return t`Desde ${min} años`
  return t`${min}–${max} años`
}

function formatHours(hours: number) {
  if (hours % 24 === 0) {
    const days = hours / 24
    return days === 1 ? t`1 día` : t`${days} días`
  }

  return t`${hours} hs`
}

const numberFormatter = new Intl.NumberFormat('es-AR')

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function formatBonusAmount(
  bonus: CampaignConfiguration['bonus_config']['speed_bonus']['windows'][number]['bonus'],
) {
  if (bonus.type === 'percentage') {
    return `+${bonus.percentage}%`
  }
  return `+${bonus.currency} ${bonus.amount}`
}
