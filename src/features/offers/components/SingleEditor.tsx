import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@tanstack/react-form'
import { t } from '@lingui/core/macro'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { useActiveCampaigns } from '#/shared/api/activeCampaigns'
import { useAppForm, applyBackendFieldErrors } from '#/shared/ui/form'
import { ApiError } from '#/shared/api/mutator'

import { useSendOfferSheetStore } from '../store/sendOfferSheetStore'
import { useCreateSingleOffer } from '../hooks/useCreateSingleOffer'
import { todayString } from '../utils/dateUtils'
import { BonusTermsFields, BonusWindowRow } from './BonusTermsFields'
import { DeliverableSummaryRow } from './DeliverableSummaryRow'
import { offerBonusTermsFormSchema } from '../schemas/bonusTerms'
import { sortBonusTerms } from '../utils/bonusTerms'

function getPlatformOptions() {
  return [
    { value: 'youtube', label: t`YouTube` },
    { value: 'instagram', label: t`Instagram` },
    { value: 'tiktok', label: t`TikTok` },
  ] as const
}

function getFormatOptionsByPlatform(): Record<
  string,
  Array<{ value: string; label: string }>
> {
  return {
    youtube: [
      { value: 'yt_long', label: t`Long Video` },
      { value: 'yt_short', label: t`Short` },
    ],
    instagram: [
      { value: 'ig_reel', label: t`Reel` },
      { value: 'ig_story', label: t`Story` },
      { value: 'ig_post', label: t`Post` },
    ],
    tiktok: [{ value: 'tiktok_post', label: t`Post` }],
  }
}

export function createSendOfferSchemas() {
  const sendOfferBaseSchema = z.object({
    campaign_id: z.string().min(1, t`Select a campaign`),
    platform: z.enum(['youtube', 'instagram', 'tiktok'], {
      error: t`Select a platform`,
    }),
    format: z.enum(
      ['yt_long', 'yt_short', 'ig_reel', 'ig_story', 'ig_post', 'tiktok_post'],
      { error: t`Select a format` },
    ),
    amount: z
      .string()
      .min(1, t`Enter an amount`)
      .regex(/^\d+\.\d{2}$/, t`Use format 0.00`)
      .refine((v) => parseFloat(v) > 0, t`Amount must be greater than 0`),
    deadline: z
      .string()
      .min(1, t`Select a deadline`)
      .refine((v) => v > todayString(), t`Deadline must be a future date`),
    bonus_terms: offerBonusTermsFormSchema,
  })
  const sendOfferSubmitSchema = sendOfferBaseSchema

  return { sendOfferBaseSchema, sendOfferSubmitSchema }
}

export const defaultValues = {
  campaign_id: '',
  platform: '' as '' | 'youtube' | 'instagram' | 'tiktok',
  format: '',
  amount: '',
  deadline: '',
  bonus_terms: {
    speed_bonus_windows: [],
  } as {
    speed_bonus_windows: Array<{
      id: string
      window_hours: number
      bonus_pct: string
    }>
  },
}

export type SendOfferFormValues = typeof defaultValues

interface SingleEditorProps {
  onClose: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export function SingleEditor({ onClose, onDirtyChange }: SingleEditorProps) {
  const { conversationId } = useSendOfferSheetStore()
  const campaignsQuery = useActiveCampaigns()
  const mutation = useCreateSingleOffer()
  const [backendBanner, setBackendBanner] = useState<string | null>(null)

  const campaigns = campaignsQuery.data ?? []

  const { sendOfferBaseSchema, sendOfferSubmitSchema } =
    createSendOfferSchemas()

  const platformOptions = getPlatformOptions()
  const formatOptionsByPlatform = getFormatOptionsByPlatform()

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: sendOfferBaseSchema,
      onSubmit: sendOfferSubmitSchema,
    },
    onSubmit: async ({ value }) => {
      if (!conversationId) return
      setBackendBanner(null)

      const payload = {
        type: 'single' as const,
        campaign_id: value.campaign_id,
        conversation_id: conversationId,
        amount: value.amount,
        deadline: value.deadline,
        bonus_terms:
          value.bonus_terms.speed_bonus_windows.length > 0
            ? sortBonusTerms(value.bonus_terms)
            : undefined,
        description: '',
        deliverable: {
          platform: value.platform,
          format: value.format,
        },
      }

      try {
        await mutation.mutateAsync(payload)
        onClose()
        toast.success(t`Offer sent`)
      } catch (error) {
        if (error instanceof ApiError && error.code === 'campaign_not_active') {
          setBackendBanner(t`This campaign is no longer active`)
          return
        }
        applyBackendFieldErrors(form, error, {
          fallback: (msg) => toast.error(msg),
        })
      }
    },
  })

  const isDirty = useStore(form.store, (s) => s.isDirty)

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const selectedCampaignId = useStore(form.store, (s) => s.values.campaign_id)
  const selectedPlatform = useStore(form.store, (s) => s.values.platform)
  const amountValue = useStore(form.store, (s) => s.values.amount)
  const bonusWindows = useStore(
    form.store,
    (s) => s.values.bonus_terms.speed_bonus_windows,
  )

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId),
    [campaigns, selectedCampaignId],
  )

  const currency = selectedCampaign?.budget_currency ?? 'USD'
  const budgetRemaining = selectedCampaign
    ? parseFloat(selectedCampaign.budget_remaining)
    : Infinity

  const parsedAmount = parseFloat(amountValue) || 0
  const totalAmount = parsedAmount
  const exceedsBudget =
    isFinite(budgetRemaining) && parsedAmount > budgetRemaining

  const campaignOptions = campaigns.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const currentFormatOptions = selectedPlatform
    ? (formatOptionsByPlatform[selectedPlatform] ?? [])
    : []

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="flex flex-1 flex-col overflow-hidden"
    >
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {backendBanner ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {backendBanner}
          </div>
        ) : null}

        <form.AppField name="campaign_id">
          {(field) => (
            <field.SelectField
              label={t`Campaign`}
              placeholder={t`Select a campaign`}
              options={campaignOptions}
            />
          )}
        </form.AppField>

        {selectedCampaign ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <span>{t`Currency`}:</span>
            <span className="font-semibold text-foreground">{currency}</span>
          </div>
        ) : null}

        <form.AppField
          name="platform"
          listeners={{
            onChange: () => {
              form.setFieldValue('format', '')
            },
          }}
        >
          {(field) => (
            <field.SelectField
              label={t`Platform`}
              placeholder={t`Select a platform`}
              options={[...platformOptions]}
            />
          )}
        </form.AppField>

        <form.AppField name="format">
          {(field) => (
            <field.SelectField
              label={t`Format`}
              placeholder={t`Select a format`}
              options={currentFormatOptions}
            />
          )}
        </form.AppField>

        <form.AppField name="amount">
          {(field) => (
            <field.TextField
              label={t`Amount (${currency})`}
              placeholder="0.00"
              inputMode="decimal"
            />
          )}
        </form.AppField>

        {exceedsBudget ? (
          <p className="text-sm text-warning" aria-live="polite">
            {t`This amount exceeds the campaign's remaining budget (${currency} ${selectedCampaign?.budget_remaining ?? '0.00'})`}
          </p>
        ) : null}

        <form.AppField name="deadline">
          {(field) => (
            <field.TextField
              label={t`Deadline`}
              type="date"
              min={todayString()}
            />
          )}
        </form.AppField>

        <form.AppField name="bonus_terms.speed_bonus_windows" mode="array">
          {(field) => (
            <BonusTermsFields
              onAdd={() =>
                field.pushValue({
                  id: crypto.randomUUID(),
                  window_hours: 24,
                  bonus_pct: '',
                })
              }
            >
              {bonusWindows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-background px-3 py-4 text-sm text-muted-foreground">
                  {t`No speed bonus windows yet.`}
                </p>
              ) : null}
              {bonusWindows.map((window, index) => (
                <BonusWindowRow
                  key={window.id}
                  index={index}
                  onRemove={() => field.removeValue(index)}
                >
                  <form.AppField
                    name={`bonus_terms.speed_bonus_windows[${index}].window_hours`}
                  >
                    {(windowField) => (
                      <windowField.NumberField
                        label={t`Window hours`}
                        min={1}
                        placeholder="24"
                      />
                    )}
                  </form.AppField>
                  <form.AppField
                    name={`bonus_terms.speed_bonus_windows[${index}].bonus_pct`}
                  >
                    {(bonusField) => (
                      <bonusField.TextField
                        label={t`Bonus percentage`}
                        placeholder="25"
                        inputMode="decimal"
                      />
                    )}
                  </form.AppField>
                </BonusWindowRow>
              ))}
            </BonusTermsFields>
          )}
        </form.AppField>

        <DeliverableSummaryRow
          label={t`Total`}
          amount={totalAmount > 0 ? totalAmount.toFixed(2) : '0.00'}
          currency={currency}
          emphasis="strong"
        />
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onClose}>
          {t`Cancel`}
        </Button>
        <form.AppForm>
          <form.SubmitButton
            label={t`Send Offer`}
            loadingLabel={t`Sending...`}
          />
        </form.AppForm>
      </footer>
    </form>
  )
}
