import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-form'
import { Sparkles } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { ApiError } from '#/shared/api/mutator'
import { FieldRow, firstErrorMessage, useAppForm } from '#/shared/ui/form'
import { ConfigurationFooter } from './ConfigurationFooter'
import { trackCampaignConfigurationStepCompleted } from './analytics'
import { CountryMultiSelect } from './components/CountryMultiSelect'
import { InterestsInput } from './components/InterestsInput'
import { TierMultiSelect } from './components/TierMultiSelect'
import {
  campaignConfigurationQueryKey,
  campaignDetailSearchDefaults,
  useUpdateCampaignTargetingMutation,
} from './hooks'
import type { CampaignConfiguration } from './hooks'
import { OperationalTargetingSchema } from './schemas'
import type { OperationalTargetingValues } from './schemas'
import { cn } from '#/lib/utils'

const GENDER_OPTIONS = [
  { value: 'female', label: () => t`Femenino` },
  { value: 'male', label: () => t`Masculino` },
  { value: 'non_binary', label: () => t`No binario` },
  { value: 'all', label: () => t`Todos` },
] as const

const CONTENT_LANGUAGE_OPTIONS = [
  { value: 'es', label: () => t`Español` },
  { value: 'en', label: () => t`English` },
  { value: 'pt', label: () => t`Português` },
  { value: 'fr', label: () => t`Français` },
  { value: 'de', label: () => t`Deutsch` },
  { value: 'it', label: () => t`Italiano` },
] as const

type TargetingPatchKey = Exclude<
  keyof OperationalTargetingValues,
  'source' | 'adjusted_from_brief'
>

const PATCH_KEYS: TargetingPatchKey[] = [
  'countries',
  'tiers',
  'follower_min',
  'follower_max',
  'genders',
  'age_min',
  'age_max',
  'interests',
  'content_languages',
]

interface TargetingStepProps {
  campaignId: string
  config: CampaignConfiguration
}

function arraysEqual<T>(left: T[], right: T[]): boolean {
  return (
    left.length === right.length &&
    left.every((item, idx) => item === right[idx])
  )
}

function valuesEqual(
  left: OperationalTargetingValues[TargetingPatchKey],
  right: OperationalTargetingValues[TargetingPatchKey],
): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return arraysEqual(left, right)
  }
  return left === right
}

export function buildOperationalTargetingPatch(
  initialValues: OperationalTargetingValues,
  currentValues: OperationalTargetingValues,
): Partial<OperationalTargetingValues> {
  return PATCH_KEYS.reduce<Partial<OperationalTargetingValues>>(
    (patch, key) => {
      if (!valuesEqual(initialValues[key], currentValues[key])) {
        return { ...patch, [key]: currentValues[key] }
      }
      return patch
    },
    {},
  )
}

function targetingDefaults(
  config: CampaignConfiguration,
): OperationalTargetingValues {
  return {
    countries: config.operational_targeting.countries,
    tiers: config.operational_targeting.tiers,
    follower_min: config.operational_targeting.follower_min,
    follower_max: config.operational_targeting.follower_max,
    genders: config.operational_targeting.genders,
    age_min: config.operational_targeting.age_min,
    age_max: config.operational_targeting.age_max,
    interests: config.operational_targeting.interests,
    content_languages: config.operational_targeting.content_languages,
    source: config.operational_targeting.source,
    adjusted_from_brief: config.operational_targeting.adjusted_from_brief,
  }
}

export function TargetingStep({ campaignId, config }: TargetingStepProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useUpdateCampaignTargetingMutation()
  const defaultValues = targetingDefaults(config)
  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: OperationalTargetingSchema,
    },
    onSubmit: async ({ value }) => {
      const operationalTargeting = buildOperationalTargetingPatch(
        defaultValues,
        value,
      )

      mutation.mutate(
        {
          campaignId,
          operational_targeting: operationalTargeting,
          configuration_version: config.configuration_version,
        },
        {
          onSuccess: (response) => {
            trackCampaignConfigurationStepCompleted({
              campaignId,
              step: 'targeting',
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
  const isDirty = useStore(form.store, (state) => state.isDirty)
  const showAdjustedBadge =
    config.operational_targeting.adjusted_from_brief || isDirty

  const handleBack = () => {
    void navigate({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step: 'pricing_model' },
      search: campaignDetailSearchDefaults,
    })
  }

  return (
    <form
      className="mx-auto flex w-full max-w-[920px] flex-col gap-4"
      action={() => void form.handleSubmit()}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground">
        <Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="flex-1">
          {t`Estos valores vienen del Brief. Podés ajustarlos sin modificar el Brief original.`}
        </p>
        {showAdjustedBadge ? (
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            {t`Ajustado desde Brief`}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TargetingSection title={t`Geografía`}>
          <form.AppField name="countries">
            {(field) => (
              <form.Subscribe selector={(state) => state.errorMap}>
                {(errorMap) => (
                  <CountryMultiSelect
                    label={t`Países`}
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    error={
                      fieldError(field.state.meta) ??
                      fieldArrayItemError(
                        'countries',
                        errorMap,
                        field.state.meta,
                      )
                    }
                  />
                )}
              </form.Subscribe>
            )}
          </form.AppField>
        </TargetingSection>

        <TargetingSection title={t`Audiencia`}>
          <form.AppField name="tiers">
            {(field) => (
              <TierMultiSelect
                label={t`Tier de creator`}
                value={field.state.value}
                onChange={field.handleChange}
                error={fieldError(field.state.meta)}
              />
            )}
          </form.AppField>

          <div className="grid gap-3 sm:grid-cols-2">
            <form.AppField name="follower_min">
              {(field) => (
                <field.NumberField
                  label={t`Seguidores mínimos`}
                  min={0}
                  placeholder="10000"
                  className="h-11 rounded-full"
                />
              )}
            </form.AppField>
            <form.AppField name="follower_max">
              {(field) => (
                <field.NumberField
                  label={t`Seguidores máximos`}
                  min={0}
                  placeholder="500000"
                  className="h-11 rounded-full"
                />
              )}
            </form.AppField>
          </div>

          <form.AppField name="genders">
            {(field) => (
              <ChipMultiSelect
                label={t`Género`}
                value={field.state.value}
                options={GENDER_OPTIONS}
                onChange={field.handleChange}
                error={fieldError(field.state.meta)}
              />
            )}
          </form.AppField>

          <div className="grid gap-3 sm:grid-cols-2">
            <form.AppField name="age_min">
              {(field) => (
                <field.NumberField
                  label={t`Edad mínima`}
                  min={18}
                  max={120}
                  placeholder="18"
                  className="h-11 rounded-full"
                />
              )}
            </form.AppField>
            <form.AppField name="age_max">
              {(field) => (
                <field.NumberField
                  label={t`Edad máxima`}
                  min={18}
                  max={120}
                  placeholder="35"
                  className="h-11 rounded-full"
                />
              )}
            </form.AppField>
          </div>
        </TargetingSection>

        <TargetingSection title={t`Contenido`} className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <form.AppField name="interests">
              {(field) => (
                <InterestsInput
                  label={t`Intereses`}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder={t`Seleccionar intereses...`}
                  error={fieldError(field.state.meta)}
                />
              )}
            </form.AppField>
            <form.AppField name="content_languages">
              {(field) => (
                <ChipMultiSelect
                  label={t`Idioma del contenido`}
                  value={field.state.value}
                  options={CONTENT_LANGUAGE_OPTIONS}
                  onChange={field.handleChange}
                  error={fieldError(field.state.meta)}
                />
              )}
            </form.AppField>
          </div>
        </TargetingSection>
      </div>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {(state) => (
          <ConfigurationFooter
            onBack={handleBack}
            onContinue={() => void form.handleSubmit()}
            continueDisabled={!state.canSubmit}
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

function fieldArrayItemError(
  fieldName: string,
  errorMap: unknown,
  meta: FieldMetaLike,
): string | undefined {
  if (!meta.isBlurred && !meta.isDirty) return undefined
  if (!errorMap || typeof errorMap !== 'object') return undefined

  for (const validationErrors of Object.values(
    errorMap as Record<string, unknown>,
  )) {
    if (!validationErrors || typeof validationErrors !== 'object') continue

    const directError = errorForPathPrefix(fieldName, validationErrors)
    if (directError) return directError

    const fields = (validationErrors as { fields?: unknown }).fields
    if (!fields || typeof fields !== 'object') continue

    const fieldErrorMessage = errorForPathPrefix(fieldName, fields)
    if (fieldErrorMessage) return fieldErrorMessage
  }

  return undefined
}

function errorForPathPrefix(fieldName: string, errorsByPath: unknown) {
  for (const [path, errors] of Object.entries(
    errorsByPath as Record<string, unknown>,
  )) {
    if (!path.startsWith(`${fieldName}[`)) continue
    return firstErrorMessage(Array.isArray(errors) ? errors : [errors])
  }

  return undefined
}

function TargetingSection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex flex-col gap-5 rounded-3xl border border-border bg-card p-5',
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

interface ChipOption {
  value: string
  label: () => string
}

function ChipMultiSelect({
  label,
  value,
  options,
  onChange,
  error,
}: {
  label: string
  value: string[]
  options: readonly ChipOption[]
  onChange: (value: string[]) => void
  error?: string
}) {
  const selected = new Set(value)

  const toggle = (item: string) => {
    onChange(
      selected.has(item)
        ? value.filter((selectedItem) => selectedItem !== item)
        : [...value, item],
    )
  }

  return (
    <FieldRow label={label} error={error}>
      {(aria) => (
        <div className="flex flex-wrap gap-2" role="group" {...aria}>
          {options.map((option) => {
            const isSelected = selected.has(option.value)
            return (
              <Button
                key={option.value}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'rounded-full',
                  isSelected && 'text-primary-foreground',
                )}
                onClick={() => toggle(option.value)}
                aria-pressed={isSelected}
              >
                {option.label()}
              </Button>
            )
          })}
        </div>
      )}
    </FieldRow>
  )
}
