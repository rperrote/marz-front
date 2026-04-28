import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@tanstack/react-form'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { useAppForm, applyBackendFieldErrors } from '#/shared/ui/form'
import { ApiError } from '#/shared/api/mutator'

import { useSendOfferSheetStore } from '../store/sendOfferSheetStore'
import { useActiveCampaigns } from '../hooks/useActiveCampaigns'
import { useCreateBundleOffer } from '../hooks/useCreateBundleOffer'
import { todayString } from '../utils/dateUtils'
import { SpeedBonusFields } from './SpeedBonusFields'
import { DeliverableSummaryRow } from './DeliverableSummaryRow'
import { BundlePlatformRow } from './BundlePlatformRow'
import {
  bundleEditorBaseSchema,
  bundleEditorSubmitSchema,
} from '../schemas/bundleEditor'

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

export const defaultValues = {
  campaign_id: '',
  total_amount: '',
  deadline: '',
  speed_bonus_enabled: false,
  speed_bonus: null as { early_deadline: string; bonus_amount: string } | null,
  deliverables: [
    {
      id: crypto.randomUUID() as string,
      platform: '',
      format: '',
      quantity: 1,
      amount: '',
    },
  ],
}

export type BundleEditorFormValues = typeof defaultValues

interface BundleEditorProps {
  onClose: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export function BundleEditor({ onClose, onDirtyChange }: BundleEditorProps) {
  const { conversationId } = useSendOfferSheetStore()
  const campaignsQuery = useActiveCampaigns()
  const mutation = useCreateBundleOffer()
  const [backendBanner, setBackendBanner] = useState<string | null>(null)

  const campaigns = campaignsQuery.data ?? []

  const platformOptions = getPlatformOptions()
  const formatOptionsByPlatform = getFormatOptionsByPlatform()

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: bundleEditorBaseSchema,
      onSubmit: bundleEditorSubmitSchema,
    },
    onSubmit: async ({ value }) => {
      if (!conversationId) return
      setBackendBanner(null)

      const payload = {
        type: 'bundle' as const,
        campaign_id: value.campaign_id,
        conversation_id: conversationId,
        total_amount: value.total_amount,
        deadline: value.deadline,
        speed_bonus:
          value.speed_bonus_enabled && value.speed_bonus
            ? {
                early_deadline: value.speed_bonus.early_deadline,
                bonus_amount: value.speed_bonus.bonus_amount,
              }
            : undefined,
        deliverables: value.deliverables.map((d) => ({
          platform: d.platform as 'youtube' | 'instagram' | 'tiktok',
          format: d.format,
          quantity: d.quantity,
          amount: d.amount.length > 0 ? d.amount : undefined,
        })),
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
  const speedBonusEnabled = useStore(
    form.store,
    (s) => s.values.speed_bonus_enabled,
  )
  const totalAmountValue = useStore(form.store, (s) => s.values.total_amount)
  const deliverables = useStore(form.store, (s) => s.values.deliverables)

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId),
    [campaigns, selectedCampaignId],
  )

  const currency = selectedCampaign?.budget_currency ?? 'USD'
  const budgetRemaining = selectedCampaign
    ? parseFloat(selectedCampaign.budget_remaining)
    : Infinity

  const parsedTotal = parseFloat(totalAmountValue) || 0
  const exceedsBudget =
    isFinite(budgetRemaining) && parsedTotal > budgetRemaining

  const campaignOptions = campaigns.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  function handleSpeedBonusToggle(enabled: boolean) {
    form.setFieldValue('speed_bonus_enabled', enabled)
    if (enabled) {
      form.setFieldValue('speed_bonus', {
        early_deadline: '',
        bonus_amount: '',
      })
    } else {
      form.setFieldValue('speed_bonus', null)
    }
  }

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

        <form.AppField name="total_amount">
          {(field) => (
            <field.TextField
              label={t`Total amount (${currency})`}
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

        <div className="space-y-4">
          <form.AppField name="deliverables" mode="array">
            {(field) => (
              <div className="space-y-4">
                {deliverables.map((item, index) => {
                  const itemPlatform = item.platform
                  return (
                    <BundlePlatformRow
                      key={item.id}
                      platform={itemPlatform}
                      index={index}
                      onRemove={() => field.removeValue(index)}
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <form.AppField
                          name={`deliverables[${index}].platform`}
                          listeners={{
                            onChange: () => {
                              form.setFieldValue(
                                `deliverables[${index}].format`,
                                '',
                              )
                            },
                          }}
                        >
                          {(f) => (
                            <f.SelectField
                              label={t`Platform`}
                              placeholder={t`Select a platform`}
                              options={[...platformOptions]}
                            />
                          )}
                        </form.AppField>

                        <form.AppField
                          key={`deliverables.${index}.format.${itemPlatform}`}
                          name={`deliverables[${index}].format`}
                        >
                          {(f) => (
                            <f.SelectField
                              label={t`Format`}
                              placeholder={t`Select a format`}
                              options={
                                itemPlatform
                                  ? (formatOptionsByPlatform[itemPlatform] ??
                                    [])
                                  : []
                              }
                            />
                          )}
                        </form.AppField>

                        <form.AppField name={`deliverables[${index}].quantity`}>
                          {(f) => (
                            <f.NumberField
                              label={t`Quantity`}
                              placeholder="1"
                              min={1}
                            />
                          )}
                        </form.AppField>

                        <form.AppField name={`deliverables[${index}].amount`}>
                          {(f) => (
                            <f.TextField
                              label={t`Amount (${currency})`}
                              placeholder="0.00"
                              inputMode="decimal"
                            />
                          )}
                        </form.AppField>
                      </div>
                    </BundlePlatformRow>
                  )
                })}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    field.pushValue({
                      id: crypto.randomUUID() as string,
                      platform: '',
                      format: '',
                      quantity: 1,
                      amount: '',
                    })
                  }
                >
                  <Plus className="mr-2 size-4" />
                  {t`Add deliverable`}
                </Button>

                {field.state.meta.errors.length > 0 && (
                  <p aria-live="polite" className="text-sm text-destructive">
                    {
                      (
                        field.state.meta.errors[0] as
                          | { message?: string }
                          | undefined
                      )?.message
                    }
                  </p>
                )}
              </div>
            )}
          </form.AppField>
        </div>

        <SpeedBonusFields
          enabled={speedBonusEnabled}
          onToggle={handleSpeedBonusToggle}
        >
          <form.AppField name="speed_bonus.early_deadline">
            {(field) => (
              <field.TextField
                label={t`Early deadline`}
                type="date"
                min={todayString()}
              />
            )}
          </form.AppField>

          <form.AppField name="speed_bonus.bonus_amount">
            {(field) => (
              <field.TextField
                label={t`Bonus amount (${currency})`}
                placeholder="0.00"
                inputMode="decimal"
              />
            )}
          </form.AppField>
        </SpeedBonusFields>

        <DeliverableSummaryRow
          label={t`Total`}
          amount={parsedTotal > 0 ? parsedTotal.toFixed(2) : '0.00'}
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
