import { useMutation } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'
import type {
  CreateBundleOfferRequest as GeneratedCreateBundleOfferRequest,
  OfferBonusTerms,
} from '#/shared/api/generated/model'

import {
  trackOfferEvent,
  toAmountBucket,
  daysFromNow,
  toPlatformMix,
} from '../analytics'

export type CreateBundleOfferRequest = GeneratedCreateBundleOfferRequest

interface OfferDTO {
  id: string
  campaign_id: string
  campaign_name: string
  brand_workspace_id: string
  creator_account_id: string
  type: 'bundle'
  status: 'sent' | 'accepted' | 'rejected' | 'expired'
  total_amount: string
  currency: string
  deadline: string
  bonus_terms: OfferBonusTerms | null
  sent_at: string
  expires_at: string
  accepted_at: string | null
  rejected_at: string | null
}

interface CreateOfferResponse {
  data: OfferDTO
  status: number
}

export function useCreateBundleOffer() {
  return useMutation<CreateOfferResponse, Error, CreateBundleOfferRequest>({
    mutationFn: (data) =>
      customFetch<CreateOfferResponse>('/v1/offers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      const amount = parseFloat(variables.amount)
      const hasBonusTerms =
        (variables.bonus_terms?.speed_bonus_windows.length ?? 0) > 0
      trackOfferEvent('offer_sent', {
        actor_kind: 'brand',
        offer_type: 'bundle',
        platform_mix: toPlatformMix(variables.deliverables),
        deliverables_count: variables.deliverables.length,
        has_bonus_terms: hasBonusTerms,
        total_amount_bucket: toAmountBucket(amount, 'USD'),
        deadline_days_from_now: daysFromNow(variables.deadline),
      })
    },
  })
}
