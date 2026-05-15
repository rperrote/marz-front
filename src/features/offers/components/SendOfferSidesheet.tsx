import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@tanstack/react-form'
import { t } from '@lingui/core/macro'
import { ChevronDown, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '#/components/ui/sheet'
import { Switch } from '#/components/ui/switch'
import { cn } from '#/lib/utils'
import { ApiError } from '#/shared/api/mutator'
import { useActiveCampaigns } from '#/shared/api/activeCampaigns'
import { FieldRow, firstErrorMessage, useAppForm } from '#/shared/ui/form'

import { useCreateOfferMutation } from '../hooks/useCreateOfferMutation'
import { createCreateOfferSchema } from '../schemas/createOffer'
import type {
  CreateOfferFormValues,
  OfferBonusTermsFormValues,
} from '../schemas/createOffer'
import { useSendOfferSheetStore } from '../store/sendOfferSheetStore'
import { useSendOfferWizard } from '../store/sendOfferWizardStore'
import type { SendOfferWizardMode } from '../store/sendOfferWizardStore'
import { OfferBonusEditor } from './OfferBonusEditor'
import { OfferSummary } from './OfferSummary'

const platformOptions = ['instagram', 'tiktok', 'youtube'] as const

const defaultBonusTerms: OfferBonusTermsFormValues = {
  enabled: true,
  speed_bonus_windows: [
    {
      _key: 'default-bonus-1',
      window_hours: 24,
      bonus_amount: { type: 'percentage', value: 10 },
    },
  ],
}

interface SendOfferSidesheetProps {
  creatorName: string
  creatorAccountId: string
}

function createDefaultValues(
  creatorAccountId: string,
  draft: Partial<CreateOfferFormValues>,
  mode: SendOfferWizardMode,
): CreateOfferFormValues {
  return {
    campaign_id: draft.campaign_id ?? '',
    creator_account_id: draft.creator_account_id ?? creatorAccountId,
    offer_mode: mode,
    amount: draft.amount ?? 0,
    tentative_publish_date: draft.tentative_publish_date ?? '',
    offer_deadline: draft.offer_deadline ?? '',
    platforms: draft.platforms ?? ['instagram'],
    bonus_terms: draft.bonus_terms ?? {
      enabled: false,
      speed_bonus_windows: [],
    },
  }
}

function translateApiError(error: ApiError) {
  if (error.code === 'bonus_not_supported_for_per_platform') {
    return t`Los bonos sólo están disponibles para un contenido único.`
  }

  return error.message
}

function getPlatformLabel(platform: (typeof platformOptions)[number]) {
  if (platform === 'instagram') return t`Instagram`
  if (platform === 'tiktok') return t`TikTok`
  return t`YouTube`
}

type OfferFieldName =
  | 'amount'
  | 'campaign_id'
  | 'creator_account_id'
  | 'platforms'
  | 'bonus_terms.speed_bonus_windows'
  | 'offer_mode'
  | 'tentative_publish_date'
  | 'offer_deadline'

function toOfferFieldName(field: string): OfferFieldName | null {
  if (field === 'bonus_terms') return 'bonus_terms.speed_bonus_windows'
  if (
    field === 'amount' ||
    field === 'campaign_id' ||
    field === 'creator_account_id' ||
    field === 'platforms' ||
    field === 'bonus_terms.speed_bonus_windows' ||
    field === 'offer_mode' ||
    field === 'tentative_publish_date' ||
    field === 'offer_deadline'
  ) {
    return field
  }

  return null
}

export function SendOfferSidesheet({
  creatorName,
  creatorAccountId,
}: SendOfferSidesheetProps) {
  const { isOpen, conversationId, close } = useSendOfferSheetStore()
  const wizard = useSendOfferWizard()
  const campaignsQuery = useActiveCampaigns()
  const createOfferMutation = useCreateOfferMutation()
  const createOfferSchema = useMemo(() => createCreateOfferSchema(), [])
  const [modeError, setModeError] = useState<string | null>(null)

  const activeDraft =
    wizard.mode === 'same_content' ? wizard.sameContent : wizard.perPlatform
  const form = useAppForm({
    defaultValues: createDefaultValues(
      creatorAccountId,
      activeDraft,
      wizard.mode,
    ),
    validators: { onChange: createOfferSchema },
    onSubmit: async ({ value }) => {
      if (!conversationId) return

      const submitValue: CreateOfferFormValues =
        value.offer_mode === 'per_platform'
          ? {
              ...value,
              bonus_terms: { enabled: false, speed_bonus_windows: [] },
            }
          : value

      try {
        await createOfferMutation.mutateAsync({
          ...submitValue,
          conversation_id: conversationId,
        })
        useSendOfferWizard.getState().reset()
        close()
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.code === 'bonus_not_supported_for_per_platform'
        ) {
          setModeError(translateApiError(error))
          form.setFieldMeta('bonus_terms.speed_bonus_windows', (prev) => ({
            ...prev,
            errorMap: {
              ...prev.errorMap,
              onServer: translateApiError(error),
            },
            isBlurred: true,
            isTouched: true,
            isDirty: true,
          }))
          return
        }

        if (error instanceof ApiError && error.details?.field_errors) {
          for (const [field, messages] of Object.entries(
            error.details.field_errors,
          )) {
            const fieldName = toOfferFieldName(field)
            const message = messages[0]
            if (!fieldName || !message) continue
            form.setFieldMeta(fieldName, (prev) => ({
              ...prev,
              errorMap: { ...prev.errorMap, onServer: message },
              isBlurred: true,
              isTouched: true,
              isDirty: true,
            }))
          }
        }
      }
    },
  })

  const values = useStore(form.store, (state) => state.values)
  const amount = useStore(form.store, (state) => state.values.amount)
  const bonusTerms = useStore(form.store, (state) => state.values.bonus_terms)
  const offerMode = useStore(form.store, (state) => state.values.offer_mode)

  useEffect(() => {
    if (values.offer_mode === 'same_content') {
      useSendOfferWizard.getState().patchSameContent(values)
      return
    }

    useSendOfferWizard.getState().patchPerPlatform(values)
  }, [values])

  useEffect(() => {
    if (!isOpen) {
      useSendOfferWizard.getState().reset()
    }
  }, [isOpen])

  function rehydrateMode(nextMode: SendOfferWizardMode) {
    setModeError(null)
    const state = useSendOfferWizard.getState()
    if (values.offer_mode === 'same_content') {
      state.patchSameContent(values)
    } else {
      state.patchPerPlatform(values)
    }

    state.setMode(nextMode)
    const nextDraft =
      nextMode === 'same_content' ? state.sameContent : state.perPlatform
    form.setFieldValue('offer_mode', nextMode)
    form.setFieldValue('campaign_id', nextDraft.campaign_id ?? '')
    form.setFieldValue('creator_account_id', creatorAccountId)
    form.setFieldValue('amount', nextDraft.amount ?? 0)
    form.setFieldValue(
      'tentative_publish_date',
      nextDraft.tentative_publish_date ?? '',
    )
    form.setFieldValue('offer_deadline', nextDraft.offer_deadline ?? '')
    form.setFieldValue('platforms', nextDraft.platforms ?? ['instagram'])
    form.setFieldValue(
      'bonus_terms',
      nextMode === 'same_content'
        ? (nextDraft.bonus_terms ?? { enabled: false, speed_bonus_windows: [] })
        : { enabled: false, speed_bonus_windows: [] },
    )
  }

  function setBonusesEnabled(enabled: boolean) {
    const currentBonusTerms = form.state.values.bonus_terms
    useSendOfferWizard.getState().setBonusesEnabledGlobal(enabled)

    if (!enabled) {
      if (currentBonusTerms?.enabled) {
        useSendOfferWizard.getState().setBonusesSnapshot(currentBonusTerms)
      }
      form.setFieldValue('bonus_terms', {
        enabled: false,
        speed_bonus_windows: [],
      })
      return
    }

    form.setFieldValue(
      'bonus_terms',
      useSendOfferWizard.getState().bonusesSnapshot ?? defaultBonusTerms,
    )
  }

  function updatePlatforms(platform: (typeof platformOptions)[number]) {
    const selected = form.state.values.platforms
    const next = selected.includes(platform)
      ? selected.filter((item) => item !== platform)
      : [...selected, platform]
    form.setFieldValue('platforms', next)
  }

  function handleClose() {
    useSendOfferWizard.getState().reset()
    close()
  }

  const campaigns = campaignsQuery.data ?? []
  const hasCampaigns = campaigns.length > 0

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-[560px]"
      >
        <SheetTitle className="sr-only">{t`Enviar oferta`}</SheetTitle>
        <SheetDescription className="sr-only">
          {t`Enviar una oferta a ${creatorName}`}
        </SheetDescription>

        <header className="flex items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="text-[length:var(--font-size-2xl)] font-semibold text-card-foreground">
              {t`Enviar oferta`}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t`Para ${creatorName}`}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label={t`Cerrar`}
            onClick={handleClose}
            className="rounded-full"
          >
            <X className="size-4" />
          </Button>
        </header>

        {campaignsQuery.isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-center text-sm text-destructive">
              {t`No pudimos cargar tus campañas. Intentá de nuevo.`}
            </p>
            <Button
              variant="outline"
              onClick={() => void campaignsQuery.refetch()}
            >
              {t`Reintentar`}
            </Button>
          </div>
        ) : !hasCampaigns && !campaignsQuery.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-center text-sm text-muted-foreground">
              {t`No tenés campañas activas para enviar ofertas.`}
            </p>
            <Button variant="outline" onClick={handleClose}>
              {t`Cerrar`}
            </Button>
          </div>
        ) : (
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              void form.handleSubmit()
            }}
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <section className="space-y-3">
                <p className="text-sm font-semibold text-card-foreground">
                  {t`Configuración`}
                </p>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t`Un contenido para todas las redes`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t`Usá el mismo monto y fechas para todas las plataformas.`}
                    </p>
                  </div>
                  <Switch
                    aria-label={t`Un contenido para todas las redes`}
                    checked={offerMode === 'same_content'}
                    onCheckedChange={(checked) =>
                      rehydrateMode(checked ? 'same_content' : 'per_platform')
                    }
                  />
                </div>
                {modeError ? (
                  <p
                    role="status"
                    aria-live="polite"
                    className="text-xs text-destructive"
                  >
                    {modeError}
                  </p>
                ) : null}
              </section>

              <section className="space-y-4 rounded-2xl border border-border bg-muted p-4">
                <form.AppField name="campaign_id">
                  {(field) => {
                    const error =
                      field.state.meta.errors.length > 0
                        ? firstErrorMessage(field.state.meta.errors)
                        : undefined

                    return (
                      <FieldRow label={t`Campaña`} error={error} required>
                        {(aria) => (
                          <Select
                            value={field.state.value}
                            onValueChange={field.handleChange}
                          >
                            <SelectTrigger
                              id={aria.id}
                              aria-describedby={aria['aria-describedby']}
                              aria-invalid={aria['aria-invalid']}
                              className="h-11 w-full rounded-xl bg-background"
                            >
                              <SelectValue placeholder={t`Elegí una campaña`} />
                            </SelectTrigger>
                            <SelectContent>
                              {campaigns.map((campaign) => (
                                <SelectItem
                                  key={campaign.id}
                                  value={campaign.id}
                                >
                                  {campaign.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </FieldRow>
                    )
                  }}
                </form.AppField>

                <div className="grid gap-3 sm:grid-cols-2">
                  <form.AppField name="amount">
                    {(field) => (
                      <FieldRow
                        label={t`Monto`}
                        error={
                          field.state.meta.errors.length > 0
                            ? firstErrorMessage(field.state.meta.errors)
                            : undefined
                        }
                        required
                      >
                        {(aria) => (
                          <Input
                            {...aria}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={field.state.value || ''}
                            onChange={(event) =>
                              field.handleChange(Number(event.target.value))
                            }
                            onBlur={field.handleBlur}
                            className="h-11 rounded-xl bg-background"
                            placeholder="4500"
                          />
                        )}
                      </FieldRow>
                    )}
                  </form.AppField>

                  <form.AppField name="tentative_publish_date">
                    {(field) => (
                      <field.TextField
                        label={t`Publicación tentativa`}
                        type="date"
                        required
                        className="h-11 rounded-xl bg-background"
                      />
                    )}
                  </form.AppField>
                </div>

                <form.AppField name="offer_deadline">
                  {(field) => (
                    <field.TextField
                      label={t`Fecha límite de respuesta`}
                      type="date"
                      required
                      className="h-11 rounded-xl bg-background"
                    />
                  )}
                </form.AppField>

                <form.AppField name="platforms">
                  {(field) => (
                    <FieldRow
                      label={t`Plataformas`}
                      error={
                        field.state.meta.errors.length > 0
                          ? firstErrorMessage(field.state.meta.errors)
                          : undefined
                      }
                      required
                    >
                      {(aria) => (
                        <div
                          id={aria.id}
                          aria-describedby={aria['aria-describedby']}
                          aria-invalid={aria['aria-invalid']}
                          className="grid grid-cols-3 gap-2"
                        >
                          {platformOptions.map((platform) => {
                            const selected =
                              field.state.value.includes(platform)

                            return (
                              <button
                                key={platform}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => updatePlatforms(platform)}
                                className={cn(
                                  'rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors',
                                  selected &&
                                    'border-primary bg-primary text-primary-foreground',
                                )}
                              >
                                {getPlatformLabel(platform)}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </FieldRow>
                  )}
                </form.AppField>
              </section>

              {offerMode === 'same_content' ? (
                <section className="space-y-3 rounded-2xl border border-border bg-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground">
                        {t`Bonos de oferta`}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t`Sumá incentivos si el creator entrega antes.`}
                      </p>
                    </div>
                    <Switch
                      aria-label={t`Bonos de oferta`}
                      checked={bonusTerms?.enabled ?? false}
                      onCheckedChange={setBonusesEnabled}
                    />
                  </div>

                  <div
                    className={cn(
                      'grid transition-[grid-template-rows,opacity] duration-200',
                      bonusTerms?.enabled
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <form.AppField name="bonus_terms.speed_bonus_windows">
                        {(field) => (
                          <OfferBonusEditor
                            value={bonusTerms ?? defaultBonusTerms}
                            error={
                              field.state.meta.errors.length > 0
                                ? firstErrorMessage(field.state.meta.errors)
                                : undefined
                            }
                            onChange={(nextBonusTerms) =>
                              form.setFieldValue('bonus_terms', nextBonusTerms)
                            }
                          />
                        )}
                      </form.AppField>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="space-y-3 rounded-2xl border border-border bg-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-card-foreground">
                    {t`Aceptación y cancelación`}
                  </h3>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li>{t`La oferta se bloquea hasta que el creator responde.`}</li>
                  <li>{t`Podés cancelar antes de que sea aceptada.`}</li>
                </ul>
              </section>

              <OfferSummary
                amount={amount}
                bonusTerms={
                  offerMode === 'same_content' ? bonusTerms : undefined
                }
              />
            </div>

            <footer className="flex justify-end gap-2 border-t border-border p-5">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={handleClose}
              >
                {t`Cancelar`}
              </Button>
              <form.AppForm>
                <form.SubmitButton
                  label={t`Enviar oferta`}
                  loadingLabel={t`Enviando`}
                  className="rounded-xl"
                />
              </form.AppForm>
            </footer>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
