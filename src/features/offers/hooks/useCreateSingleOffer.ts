import { useMutation } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'
import type {
  CreateSingleOfferRequest as GeneratedCreateSingleOfferRequest,
  OfferBonusTerms,
} from '#/shared/api/generated/model'

import { trackOfferEvent, toAmountBucket, daysFromNow } from '../analytics'

export type CreateSingleOfferRequest = GeneratedCreateSingleOfferRequest

interface OfferDTO {
  id: string
  campaign_id: string
  campaign_name: string
  brand_workspace_id: string
  creator_account_id: string
  type: 'single'
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

export function useCreateSingleOffer() {
  return useMutation<CreateOfferResponse, Error, CreateSingleOfferRequest>({
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
        offer_type: 'single',
        platform_mix: [variables.deliverable.platform],
        has_bonus_terms: hasBonusTerms,
        total_amount_bucket: toAmountBucket(amount, 'USD'),
        deadline_days_from_now: daysFromNow(variables.deadline),
      })
    },
  })
}
