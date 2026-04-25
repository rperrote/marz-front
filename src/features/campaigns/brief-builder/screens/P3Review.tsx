import { useCallback, useEffect, useRef } from 'react'
import { useStore } from '@tanstack/react-form'
import { Plus, X } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { useAppForm, FieldRow } from '#/shared/ui/form'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { useBriefBuilderStore } from '../store'
import type {
  BriefDraft,
  ScoringDimension,
  HardFilter,
  Gender,
  Platform,
  CampaignObjective,
} from '../store'
import { phase3Schema } from '../schemas'
import type { Phase3Values } from '../schemas'
import { useRegisterStepValidator } from '../validation'
import { ScoringDimensionCard } from '../components/ScoringDimensionCard'
import { WeightSumIndicator } from '../components/WeightSumIndicator'
import { HardFilterForm } from '../components/HardFilterForm'

const EMPTY_DRAFT: BriefDraft = {
  campaign: {
    name: '',
    objective: '',
    budget_amount: null,
    budget_currency: 'USD',
    deadline: '',
  },
  brief: {
    icp_description: null,
    icp_age_min: null,
    icp_age_max: null,
    icp_genders: [],
    icp_countries: [],
    icp_platforms: [],
    icp_interests: [],
    scoring_dimensions: [],
    hard_filters: [],
    disqualifiers: [],
  },
}

const OBJECTIVE_OPTIONS = [
  { value: 'brand_awareness', label: () => t`Brand Awareness` },
  { value: 'conversion', label: () => t`Conversión` },
  { value: 'engagement', label: () => t`Engagement` },
  { value: 'reach', label: () => t`Alcance` },
] as const

const GENDER_OPTIONS: { value: Gender; label: () => string }[] = [
  { value: 'male', label: () => t`Masculino` },
  { value: 'female', label: () => t`Femenino` },
  { value: 'non_binary', label: () => t`No binario` },
]

const PLATFORM_OPTIONS: { value: Platform; label: () => string }[] = [
  { value: 'youtube', label: () => t`YouTube` },
  { value: 'instagram', label: () => t`Instagram` },
  { value: 'tiktok', label: () => t`TikTok` },
]

function draftToFormValues(draft: BriefDraft): Phase3Values {
  return {
    campaign: {
      name: draft.campaign.name,
      objective: draft.campaign.objective,
      budget_amount: draft.campaign.budget_amount ?? 0,
      budget_currency: draft.campaign.budget_currency || 'USD',
      deadline: draft.campaign.deadline || undefined,
    },
    brief: {
      icp_description: draft.brief.icp_description,
      icp_age_min: draft.brief.icp_age_min,
      icp_age_max: draft.brief.icp_age_max,
      icp_genders: [...draft.brief.icp_genders],
      icp_countries: [...draft.brief.icp_countries],
      icp_platforms: [...draft.brief.icp_platforms],
      icp_interests: [...draft.brief.icp_interests],
      scoring_dimensions: draft.brief.scoring_dimensions.map((d) => ({
        ...d,
        id: d.id || crypto.randomUUID(),
      })),
      hard_filters: draft.brief.hard_filters.map((f) => ({ ...f })),
      disqualifiers: [...draft.brief.disqualifiers],
    },
  }
}

function formValuesToDraft(values: Phase3Values): BriefDraft {
  return {
    campaign: {
      name: values.campaign.name,
      objective: values.campaign.objective as CampaignObjective | '',
      budget_amount: values.campaign.budget_amount,
      budget_currency: values.campaign.budget_currency,
      deadline: values.campaign.deadline ?? '',
    },
    brief: {
      icp_description: values.brief.icp_description,
      icp_age_min: values.brief.icp_age_min,
      icp_age_max: values.brief.icp_age_max,
      icp_genders: values.brief.icp_genders,
      icp_countries: values.brief.icp_countries,
      icp_platforms: values.brief.icp_platforms,
      icp_interests: values.brief.icp_interests,
      scoring_dimensions: values.brief.scoring_dimensions,
      hard_filters: values.brief.hard_filters,
      disqualifiers: values.brief.disqualifiers,
    },
  }
}

function isDraftEmpty(draft: BriefDraft): boolean {
  return (
    draft.brief.scoring_dimensions.length === 0 &&
    draft.campaign.name.length === 0 &&
    !draft.brief.icp_description &&
    draft.brief.icp_genders.length === 0 &&
    draft.brief.icp_platforms.length === 0 &&
    draft.brief.hard_filters.length === 0 &&
    draft.brief.disqualifiers.length === 0
  )
}

function ToggleChip({
  label,
  selected,
  onToggle,
}: {
  label: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={
        selected
          ? 'inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-primary bg-primary/[0.125] px-4 text-[length:var(--font-size-sm)] font-semibold text-primary transition-colors'
          : 'inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-[length:var(--font-size-sm)] font-medium text-foreground transition-colors hover:bg-surface-hover'
      }
    >
      {label}
    </button>
  )
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (value: string) => {
    const trimmed = value.trim()
    if (trimmed.length === 0 || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
  }

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[length:var(--font-size-xs)] text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={t`Eliminar ${tag}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        ref={inputRef}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addTag(e.currentTarget.value)
            e.currentTarget.value = ''
          }
        }}
      />
    </div>
  )
}

function InsufficientBanner() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-3 text-[length:var(--font-size-sm)] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    >
      {t`La información proporcionada no fue suficiente para generar el brief completo. Llená los campos manualmente.`}
    </div>
  )
}

function InsufficientFieldHint() {
  return (
    <span className="text-[length:var(--font-size-xs)] text-amber-600 dark:text-amber-400">
      {t`Información insuficiente para este campo`}
    </span>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[length:var(--font-size-lg)] font-semibold text-foreground">
      {children}
    </h2>
  )
}

export function P3Review() {
  const store = useBriefBuilderStore()
  const draft = store.briefDraft ?? EMPTY_DRAFT
  const draftIsEmpty = isDraftEmpty(draft)

  const form = useAppForm({
    defaultValues: draftToFormValues(draft),
    validators: {
      onChange: phase3Schema,
    },
    onSubmit: () => {},
  })

  const values = useStore(form.store, (s) => s.values)
  const prevRef = useRef(values)

  useEffect(() => {
    if (prevRef.current === values) return
    prevRef.current = values
    useBriefBuilderStore.setState({
      briefDraft: formValuesToDraft(values),
    })
  }, [values])

  useRegisterStepValidator(
    useCallback(async () => {
      await form.handleSubmit()
      return form.state.isValid
    }, [form]),
  )

  const scoringDimensions = values.brief.scoring_dimensions
  const weightSum = scoringDimensions.reduce((a, d) => a + d.weight_pct, 0)

  const updateDimension = (index: number, updated: ScoringDimension) => {
    const next = scoringDimensions.map((d, i) => (i === index ? updated : d))
    form.setFieldValue('brief.scoring_dimensions', next)
  }

  const removeDimension = (index: number) => {
    form.setFieldValue(
      'brief.scoring_dimensions',
      scoringDimensions.filter((_, i) => i !== index),
    )
  }

  const addDimension = () => {
    if (scoringDimensions.length >= 4) return
    form.setFieldValue('brief.scoring_dimensions', [
      ...scoringDimensions,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        weight_pct: 25,
        positive_signals: [],
        negative_signals: [],
      },
    ])
  }

  const toggleGender = (gender: Gender) => {
    const current = values.brief.icp_genders
    const next = current.includes(gender)
      ? current.filter((g) => g !== gender)
      : [...current, gender]
    form.setFieldValue('brief.icp_genders', next)
  }

  const togglePlatform = (platform: Platform) => {
    const current = values.brief.icp_platforms
    const next = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform]
    form.setFieldValue('brief.icp_platforms', next)
  }

  const updateHardFilters = (filters: HardFilter[]) => {
    form.setFieldValue('brief.hard_filters', filters)
  }

  const updateDisqualifiers = (disqualifiers: string[]) => {
    form.setFieldValue('brief.disqualifiers', disqualifiers)
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <WizardSectionTitle
        title={t`Revisá tu brief`}
        subtitle={t`Editá lo que necesites antes de confirmar la campaña.`}
      />

      {draftIsEmpty && <InsufficientBanner />}

      <div className="flex w-full max-w-[640px] flex-col gap-10">
        {/* Campaign Section */}
        <section className="flex flex-col gap-4">
          <SectionHeading>{t`Campaña`}</SectionHeading>
          <form.AppField name="campaign.name">
            {(field) => (
              <field.TextField
                label={t`Nombre`}
                placeholder={t`Ej: Lanzamiento verano 2026`}
                maxLength={150}
              />
            )}
          </form.AppField>
          <form.AppField name="campaign.objective">
            {(field) => (
              <field.SelectField
                label={t`Objetivo`}
                placeholder={t`Seleccioná un objetivo`}
                options={OBJECTIVE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label(),
                }))}
              />
            )}
          </form.AppField>
          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="campaign.budget_amount">
              {(field) => (
                <field.NumberField
                  label={t`Presupuesto (USD)`}
                  placeholder="5000"
                  min={1}
                />
              )}
            </form.AppField>
            <form.AppField name="campaign.deadline">
              {(field) => <field.TextField label={t`Deadline`} type="date" />}
            </form.AppField>
          </div>
        </section>

        {/* ICP Section */}
        <section className="flex flex-col gap-4">
          <SectionHeading>{t`Perfil de creador ideal (ICP)`}</SectionHeading>

          <FieldRow label={t`Descripción`}>
            {(aria) => (
              <>
                {!values.brief.icp_description && <InsufficientFieldHint />}
                <Input
                  {...aria}
                  value={values.brief.icp_description ?? ''}
                  onChange={(e) =>
                    form.setFieldValue(
                      'brief.icp_description',
                      e.target.value || null,
                    )
                  }
                  placeholder={t`Descripción del perfil ideal`}
                />
              </>
            )}
          </FieldRow>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label={t`Edad mínima`}>
              {(aria) => (
                <Input
                  {...aria}
                  type="number"
                  inputMode="numeric"
                  min={13}
                  max={99}
                  value={values.brief.icp_age_min ?? ''}
                  onChange={(e) =>
                    form.setFieldValue(
                      'brief.icp_age_min',
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                />
              )}
            </FieldRow>
            <FieldRow label={t`Edad máxima`}>
              {(aria) => (
                <Input
                  {...aria}
                  type="number"
                  inputMode="numeric"
                  min={13}
                  max={99}
                  value={values.brief.icp_age_max ?? ''}
                  onChange={(e) =>
                    form.setFieldValue(
                      'brief.icp_age_max',
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                />
              )}
            </FieldRow>
          </div>

          <FieldRow label={t`Géneros`}>
            {() => (
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <ToggleChip
                    key={opt.value}
                    label={opt.label()}
                    selected={values.brief.icp_genders.includes(opt.value)}
                    onToggle={() => toggleGender(opt.value)}
                  />
                ))}
              </div>
            )}
          </FieldRow>

          <FieldRow label={t`Plataformas`}>
            {() => (
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((opt) => (
                  <ToggleChip
                    key={opt.value}
                    label={opt.label()}
                    selected={values.brief.icp_platforms.includes(opt.value)}
                    onToggle={() => togglePlatform(opt.value)}
                  />
                ))}
              </div>
            )}
          </FieldRow>

          <FieldRow label={t`Países (código ISO 2 letras)`}>
            {() => (
              <TagInput
                tags={values.brief.icp_countries}
                onChange={(countries) =>
                  form.setFieldValue('brief.icp_countries', countries)
                }
                placeholder={t`Ej: AR, US, MX`}
              />
            )}
          </FieldRow>

          <FieldRow label={t`Intereses`}>
            {() => (
              <TagInput
                tags={values.brief.icp_interests}
                onChange={(interests) =>
                  form.setFieldValue('brief.icp_interests', interests)
                }
                placeholder={t`Ej: fitness, moda, gaming`}
              />
            )}
          </FieldRow>
        </section>

        {/* Scoring Dimensions */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionHeading>{t`Scoring Dimensions`}</SectionHeading>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDimension}
              disabled={scoringDimensions.length >= 4}
              aria-label={t`Agregar dimensión`}
            >
              <Plus className="size-3.5" />
              {t`Agregar dimensión`}
            </Button>
          </div>

          {scoringDimensions.length === 0 && <InsufficientFieldHint />}

          <WeightSumIndicator sum={weightSum} />

          {scoringDimensions.map((dim, idx) => (
            <ScoringDimensionCard
              key={dim.id}
              index={idx}
              dimension={dim}
              onChange={(updated) => updateDimension(idx, updated)}
              onRemove={() => removeDimension(idx)}
            />
          ))}
        </section>

        {/* Hard Filters */}
        <section className="flex flex-col gap-4">
          <SectionHeading>{t`Filtros duros`}</SectionHeading>
          <HardFilterForm
            filters={values.brief.hard_filters}
            onChange={updateHardFilters}
          />
        </section>

        {/* Disqualifiers */}
        <section className="flex flex-col gap-4">
          <SectionHeading>{t`Descalificadores`}</SectionHeading>
          <TagInput
            tags={values.brief.disqualifiers}
            onChange={updateDisqualifiers}
            placeholder={t`Ej: contenido +18, tabaco, apuestas`}
          />
        </section>
      </div>
    </div>
  )
}
