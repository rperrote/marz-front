import { useMutation } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'
import type { CreateMultiStageOfferRequest as GeneratedCreateMultiStageOfferRequest } from '#/shared/api/generated/model'

import {
  trackOfferEvent,
  toAmountBucket,
  maxDeadlineFromNow,
} from '../analytics'

export type CreateMultistageOfferRequest = GeneratedCreateMultiStageOfferRequest

interface OfferDTO {
  id: string
  campaign_id: string
  campaign_name: string
  brand_workspace_id: string
  creator_account_id: string
  type: 'multistage'
  status: 'sent' | 'accepted' | 'rejected' | 'expired'
  total_amount: string
  currency: string
  deadline: string
  bonus_terms: null
  sent_at: string
  expires_at: string
  accepted_at: string | null
  rejected_at: string | null
}

interface CreateOfferResponse {
  data: OfferDTO
  status: number
}

export function useCreateMultistageOffer() {
  return useMutation<CreateOfferResponse, Error, CreateMultistageOfferRequest>({
    mutationFn: (data) =>
      customFetch<CreateOfferResponse>('/v1/offers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      const total = variables.stages.reduce(
        (sum, s) => sum + parseFloat(s.amount),
        0,
      )
      trackOfferEvent('offer_sent', {
        actor_kind: 'brand',
        offer_type: 'multistage',
        platform_mix: [],
        stages_count: variables.stages.length,
        has_bonus_terms: false,
        total_amount_bucket: toAmountBucket(total, 'USD'),
        deadline_days_from_now: maxDeadlineFromNow(
          variables.stages.map((stage) => stage.deadline),
        ),
      })
    },
  })
}
