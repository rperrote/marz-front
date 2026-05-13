import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-form'
import type { FieldComponent } from '@tanstack/react-form'
import type { ReactNode } from 'react'
import { Check, Plus, TrendingUp, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/utils'
import { ApiError } from '#/shared/api/mutator'
import { FieldRow, firstErrorMessage, useAppForm } from '#/shared/ui/form'
import { ConfigurationFooter } from './ConfigurationFooter'
import { trackCampaignConfigurationStepCompleted } from './analytics'
import { PerformanceBonusRow } from './components/PerformanceBonusRow'
import { SpeedBonusRow } from './components/SpeedBonusRow'
import {
  campaignConfigurationQueryKey,
  campaignDetailSearchDefaults,
  useUpdateCampaignBonusMutation,
} from './hooks'
import type { CampaignConfiguration } from './hooks'
import { BonusAmountSchema, BonusConfigSchema } from './schemas'
import type { BonusAmountValues, BonusConfigValues } from './schemas'

type SpeedBonusWindow = BonusConfigValues['speed_bonus']['windows'][number]
type PerformanceBonusMilestone =
  BonusConfigValues['performance_bonus']['milestones'][number]

type BonusAppField = FieldComponent<BonusConfigValues, any, any, any, any, any, any, any, any, any, any, any, any>

const EMPTY_BONUS_CONFIG: BonusConfigValues = {
  enabled: false,
  speed_bonus: { enabled: false, windows: [] },
  performance_bonus: { enabled: false, milestones: [] },
}

interface BonusStepProps {
  campaignId: string
  config: CampaignConfiguration
}

// El spec tipa CampaignBonusAmount con todos los campos opcionales discriminados
// por `type` (laxo). El form local usa un discriminated union estricto. Convertimos.
function mapBonusAmount(amount: {
  type: string
  percentage?: number
  amount?: string
  currency?: string
}):
  | { type: 'percentage'; percentage: number }
  | { type: 'fixed'; amount: string; currency: string } {
  if (amount.type === 'percentage') {
    return { type: 'percentage', percentage: amount.percentage ?? 0 }
  }
  return {
    type: 'fixed',
    amount: amount.amount ?? '0',
    currency: amount.currency ?? '',
  }
}

function bonusDefaults(config: CampaignConfiguration): BonusConfigValues {
  return {
    enabled: config.bonus_config.enabled,
    speed_bonus: {
      enabled: config.bonus_config.speed_bonus.enabled,
      windows: sortSpeedWindows(
        config.bonus_config.speed_bonus.windows.map((w) => ({
          window_id: w.window_id,
          window_hours: w.window_hours,
          bonus: mapBonusAmount(w.bonus),
        })),
      ),
    },
    performance_bonus: {
      enabled: config.bonus_config.performance_bonus.enabled,
      milestones: config.bonus_config.performance_bonus.milestones.map((m) => ({
        milestone_id: m.milestone_id,
        views: m.views,
        window_hours: m.window_hours,
        bonus: mapBonusAmount(m.bonus),
      })),
    },
  }
}

export function normalizeBonusConfig(
  value: BonusConfigValues,
): BonusConfigValues {
  if (!value.enabled) {
    return EMPTY_BONUS_CONFIG
  }

  return {
    enabled: true,
    speed_bonus: {
      enabled: value.speed_bonus.enabled,
      windows: value.speed_bonus.enabled
        ? sortSpeedWindows(value.speed_bonus.windows)
        : [],
    },
    performance_bonus: {
      enabled: value.performance_bonus.enabled,
      milestones: value.performance_bonus.enabled
        ? [...value.performance_bonus.milestones]
        : [],
    },
  }
}

export function speedBonusSectionError(
  windows: SpeedBonusWindow[],
): string | undefined {
  const seenWindowHours = new Set<number>()
  for (const window of windows) {
    if (seenWindowHours.has(window.window_hours)) {
      return t`Hay ventanas duplicadas. Usá una sola fila por cantidad de horas.`
    }
    seenWindowHours.add(window.window_hours)
  }

  return undefined
}

export function performanceBonusSectionError(
  milestones: PerformanceBonusMilestone[],
): string | undefined {
  const seenViews = new Set<number>()
  for (const milestone of milestones) {
    if (seenViews.has(milestone.views)) {
      return t`Hay milestones duplicados. Usá una sola fila por cantidad de views.`
    }
    seenViews.add(milestone.views)
  }

  return undefined
}

const DEFAULT_PERCENTAGE_BONUS: BonusAmountValues = {
  type: 'percentage',
  percentage: 10,
}

function nextSpeedBonusWindow(windows: SpeedBonusWindow[]): SpeedBonusWindow {
  const lastWindow = sortSpeedWindows(windows).at(-1)
  return {
    window_hours: lastWindow ? Math.min(lastWindow.window_hours + 24, 720) : 24,
    bonus: lastWindow ? lastWindow.bonus : DEFAULT_PERCENTAGE_BONUS,
  }
}

function nextPerformanceBonusMilestone(
  milestones: PerformanceBonusMilestone[],
): PerformanceBonusMilestone {
  const lastMilestone = milestones
    .toSorted((left, right) => left.views - right.views)
    .at(-1)

  return {
    views: lastMilestone ? lastMilestone.views + 50000 : 10000,
    window_hours: lastMilestone
      ? Math.min(lastMilestone.window_hours + 168, 720)
      : 168,
    bonus: lastMilestone ? lastMilestone.bonus : DEFAULT_PERCENTAGE_BONUS,
  }
}

function sortSpeedWindows(windows: SpeedBonusWindow[]): SpeedBonusWindow[] {
  return windows.toSorted(
    (left, right) => left.window_hours - right.window_hours,
  )
}

function hasStepCompleted(config: CampaignConfiguration): boolean {
  return config.completed_steps.includes('bonus')
}

export function BonusStep({ campaignId, config }: BonusStepProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useUpdateCampaignBonusMutation()
  const defaultValues = bonusDefaults(config)
  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: BonusConfigSchema,
    },
    onSubmit: async ({ value }) => {
      const bonusConfig = normalizeBonusConfig(value)

      mutation.mutate(
        {
          campaignId,
          bonus_config: bonusConfig,
          configuration_version: config.configuration_version,
        },
        {
          onSuccess: (response) => {
            trackCampaignConfigurationStepCompleted({
              campaignId,
              step: 'bonus',
              previousConfig: config,
              nextConfig: response,
            })
            queryClient.setQueryData(
              campaignConfigurationQueryKey(campaignId),
              response,
            )
            void navigate({
              to: '/campaigns/$campaignId/configuration/$step',
              params: { campaignId, step: response.current_step },
              search: campaignDetailSearchDefaults,
            })
          },
          onError: (error) => {
            if (
              error instanceof ApiError &&
              error.status === 409 &&
              error.code === 'configuration_version_conflict'
            ) {
              void queryClient.invalidateQueries({
                queryKey: campaignConfigurationQueryKey(campaignId),
              })
              toast.error(
                t`La configuración fue modificada en otra sesión, recargando.`,
              )
            }
          },
        },
      )
    },
  })
  const values = useStore(form.store, (state) => state.values)
  const isDirty = useStore(form.store, (state) => state.isDirty)
  const speedError = values.speed_bonus.enabled
    ? speedBonusSectionError(values.speed_bonus.windows)
    : undefined
  const performanceError = values.performance_bonus.enabled
    ? performanceBonusSectionError(values.performance_bonus.milestones)
    : undefined

  function handleBack() {
    void navigate({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step: 'targeting' },
      search: campaignDetailSearchDefaults,
    })
  }

  function handleGlobalToggle(enabled: boolean) {
    form.setFieldValue('enabled', enabled)
    if (!enabled) {
      form.setFieldValue('speed_bonus.enabled', false)
      form.setFieldValue('speed_bonus.windows', [])
      form.setFieldValue('performance_bonus.enabled', false)
      form.setFieldValue('performance_bonus.milestones', [])
    }
  }

  function handleSpeedToggle(enabled: boolean) {
    form.setFieldValue('speed_bonus.enabled', enabled)
    if (!enabled) {
      form.setFieldValue('speed_bonus.windows', [])
    }
  }

  function handlePerformanceToggle(enabled: boolean) {
    form.setFieldValue('performance_bonus.enabled', enabled)
    if (!enabled) {
      form.setFieldValue('performance_bonus.milestones', [])
    }
  }

  function handleContinue() {
    if (hasStepCompleted(config) && !isDirty) {
      void navigate({
        to: '/campaigns/$campaignId/configuration/$step',
        params: { campaignId, step: 'review' },
        search: campaignDetailSearchDefaults,
      })
      return
    }

    void form.handleSubmit()
  }

  return (
    <form
      className="mx-auto flex w-full max-w-[920px] flex-col gap-4"
      action={handleContinue}
    >
      <BonusGlobalToggle
        AppField={form.AppField}
        onToggle={handleGlobalToggle}
      />

      {values.enabled ? (
        <>
          <BonusTypeCards
            speedSelected={values.speed_bonus.enabled}
            performanceSelected={values.performance_bonus.enabled}
            onSpeedSelect={() => handleSpeedToggle(!values.speed_bonus.enabled)}
            onPerformanceSelect={() =>
              handlePerformanceToggle(!values.performance_bonus.enabled)
            }
          />

          {values.speed_bonus.enabled ? (
            <SpeedBonusSection
              AppField={form.AppField}
              values={values}
              speedError={speedError}
            />
          ) : null}

          {values.performance_bonus.enabled ? (
            <PerformanceBonusSection
              AppField={form.AppField}
              values={values}
              performanceError={performanceError}
            />
          ) : null}
        </>
      ) : null}

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {(state) => (
          <ConfigurationFooter
            onBack={handleBack}
            onContinue={handleContinue}
            continueDisabled={
              Boolean(speedError ?? performanceError) ||
              (!state.canSubmit && !(hasStepCompleted(config) && !isDirty))
            }
            isPending={state.isSubmitting || mutation.isPending}
          />
        )}
      </form.Subscribe>
    </form>
  )
}

interface FieldMetaLike {
  errors: ReadonlyArray<unknown>
  isBlurred: boolean
  isDirty: boolean
}

function fieldError(meta: FieldMetaLike): string | undefined {
  if (!meta.isBlurred && !meta.isDirty) return undefined
  return firstErrorMessage(meta.errors)
}

interface BonusGlobalToggleProps {
  AppField: BonusAppField
  onToggle: (enabled: boolean) => void
}

function BonusGlobalToggle({ AppField, onToggle }: BonusGlobalToggleProps) {
  return (
    <section className="flex items-center gap-4 rounded-3xl border border-primary/40 bg-primary/10 p-5">
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-foreground">
          {t`Activar bonus de pago`}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t`Premiá a creators con un porcentaje extra por velocidad o performance.`}
        </p>
      </div>
      <AppField name="enabled">
        {(field) => (
          <Switch
            checked={field.state.value}
            onCheckedChange={onToggle}
            onBlur={field.handleBlur}
            aria-label={t`Activar bonus de pago`}
          />
        )}
      </AppField>
    </section>
  )
}

interface BonusTypeCardsProps {
  speedSelected: boolean
  performanceSelected: boolean
  onSpeedSelect: () => void
  onPerformanceSelect: () => void
}

function BonusTypeCards({
  speedSelected,
  performanceSelected,
  onSpeedSelect,
  onPerformanceSelect,
}: BonusTypeCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BonusTypeCard
        title={t`Speed Bonus`}
        description={t`Premiá a creators que postean rápido con ventanas por horas.`}
        Icon={Zap}
        selected={speedSelected}
        onSelect={onSpeedSelect}
      />
      <BonusTypeCard
        title={t`Performance Bonus`}
        description={t`Premiá milestones de views alcanzados dentro de una ventana.`}
        Icon={TrendingUp}
        selected={performanceSelected}
        onSelect={onPerformanceSelect}
      />
    </div>
  )
}

interface SpeedBonusSectionProps {
  AppField: BonusAppField
  values: BonusConfigValues
  speedError: string | undefined
}

function SpeedBonusSection({ AppField, values, speedError }: SpeedBonusSectionProps) {
  return (
    <AppField name="speed_bonus.windows" mode="array">
      {(field) => (
        <BonusRowsSection
          title={t`Ventanas de Speed Bonus`}
          addLabel={t`Agregar ventana`}
          error={speedError}
          onAdd={() =>
            field.pushValue(nextSpeedBonusWindow(values.speed_bonus.windows))
          }
        >
          {values.speed_bonus.windows.map((window, index) => (
            <AppField
              key={window.window_id ?? `speed-${String(index)}`}
              name={`speed_bonus.windows[${index}].window_hours`}
            >
              {(windowHoursField) => (
                <AppField
                  name={`speed_bonus.windows[${index}].bonus`}
                  validators={{ onChange: BonusAmountSchema }}
                >
                  {(bonusField) => (
                    <SpeedBonusRow
                      index={index}
                      windowHours={windowHoursField.state.value}
                      bonus={bonusField.state.value}
                      windowHoursError={fieldError(windowHoursField.state.meta)}
                      bonusError={fieldError(bonusField.state.meta)}
                      onWindowHoursChange={(value) =>
                        windowHoursField.handleChange(value)
                      }
                      onBonusChange={(value) => bonusField.handleChange(value)}
                      onWindowHoursBlur={windowHoursField.handleBlur}
                      onBonusBlur={bonusField.handleBlur}
                      onRemove={() => field.removeValue(index)}
                    />
                  )}
                </AppField>
              )}
            </AppField>
          ))}
        </BonusRowsSection>
      )}
    </AppField>
  )
}

interface PerformanceBonusSectionProps {
  AppField: BonusAppField
  values: BonusConfigValues
  performanceError: string | undefined
}

function PerformanceBonusSection({
  AppField,
  values,
  performanceError,
}: PerformanceBonusSectionProps) {
  return (
    <AppField name="performance_bonus.milestones" mode="array">
      {(field) => (
        <BonusRowsSection
          title={t`Milestones de Performance`}
          addLabel={t`Agregar milestone`}
          error={performanceError}
          onAdd={() =>
            field.pushValue(
              nextPerformanceBonusMilestone(
                values.performance_bonus.milestones,
              ),
            )
          }
        >
          {values.performance_bonus.milestones.map((milestone, index) => (
            <AppField
              key={milestone.milestone_id ?? `performance-${String(index)}`}
              name={`performance_bonus.milestones[${index}].views`}
            >
              {(viewsField) => (
                <AppField
                  name={`performance_bonus.milestones[${index}].window_hours`}
                >
                  {(windowHoursField) => (
                    <AppField
                      name={`performance_bonus.milestones[${index}].bonus`}
                      validators={{ onChange: BonusAmountSchema }}
                    >
                      {(bonusField) => (
                        <PerformanceBonusRow
                          index={index}
                          views={viewsField.state.value}
                          windowHours={windowHoursField.state.value}
                          bonus={bonusField.state.value}
                          viewsError={fieldError(viewsField.state.meta)}
                          windowHoursError={fieldError(
                            windowHoursField.state.meta,
                          )}
                          bonusError={fieldError(bonusField.state.meta)}
                          onViewsChange={(value) =>
                            viewsField.handleChange(value)
                          }
                          onWindowHoursChange={(value) =>
                            windowHoursField.handleChange(value)
                          }
                          onBonusChange={(value) =>
                            bonusField.handleChange(value)
                          }
                          onViewsBlur={viewsField.handleBlur}
                          onWindowHoursBlur={windowHoursField.handleBlur}
                          onBonusBlur={bonusField.handleBlur}
                          onRemove={() => field.removeValue(index)}
                        />
                      )}
                    </AppField>
                  )}
                </AppField>
              )}
            </AppField>
          ))}
        </BonusRowsSection>
      )}
    </AppField>
  )
}

function BonusTypeCard({
  title,
  description,
  Icon,
  selected,
  onSelect,
}: {
  title: string
  description: string
  Icon: LucideIcon
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-28 items-start gap-4 rounded-3xl border bg-card p-5 text-left transition-colors',
        'hover:border-primary/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:bg-muted/50',
      )}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-2xl',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full border',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-muted',
        )}
        aria-hidden="true"
      >
        {selected ? <Check className="size-3.5" /> : null}
      </span>
    </button>
  )
}

function BonusRowsSection({
  title,
  addLabel,
  error,
  children,
  onAdd,
}: {
  title: string
  addLabel: string
  error?: string
  children: ReactNode
  onAdd: () => void
}) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={onAdd}
        >
          <Plus className="size-4" aria-hidden="true" />
          {addLabel}
        </Button>
      </div>
      {children}
      {error ? (
        <FieldRow error={error}>
          {(aria) => <div {...aria} role="alert" aria-live="polite" />}
        </FieldRow>
      ) : null}
    </section>
  )
}
