import { useMutation } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'

import { trackOfferEvent, toAmountBucket, daysFromNow } from '../analytics'

export interface CreateMultistageOfferRequest {
  type: 'multistage'
  campaign_id: string
  conversation_id: string
  stages: Array<{
    name: string
    description: string
    deadline: string
    amount: string
  }>
}

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
  speed_bonus: null
  sent_at: string
  expires_at: string
  accepted_at: string | null
  rejected_at: string | null
}

interface CreateOfferResponse {
  data: OfferDTO
  status: number
}

// RAFITA:BLOCKER: Backend dev (localhost:8080) still does not expose the extended OpenAPI spec (B.5).
// `pnpm api:sync` ran clean on 2026-04-28 but the spec contains no offer endpoints or polymorphic types
// (CreateOfferRequest, OfferDTO, OfferSnapshot, StageOpenedSnap are absent).
// Coordinate with backend to merge the extended contract before regenerating the Orval client.
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
        platform: 'unknown',
        has_speed_bonus: false,
        amount_bucket: toAmountBucket(total, 'USD'),
        deadline_days_from_now: daysFromNow(
          variables.stages[0]?.deadline ?? '',
        ),
      })
    },
  })
}
