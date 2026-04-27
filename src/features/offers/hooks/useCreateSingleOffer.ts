import { useMutation } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'

import { trackOfferEvent, toAmountBucket, daysFromNow } from '../analytics'

export interface CreateSingleOfferRequest {
  campaign_id: string
  conversation_id: string
  platform: 'youtube' | 'instagram' | 'tiktok'
  format:
    | 'yt_long'
    | 'yt_short'
    | 'ig_reel'
    | 'ig_story'
    | 'ig_post'
    | 'tiktok_post'
  amount: string
  deadline: string
  speed_bonus?: {
    early_deadline: string
    bonus_amount: string
  } | null
}

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
  speed_bonus: {
    early_deadline: string
    bonus_amount: string
    currency: string
  } | null
  sent_at: string
  expires_at: string
  accepted_at: string | null
  rejected_at: string | null
}

interface CreateOfferResponse {
  data: OfferDTO
  status: number
}

// RAFITA:BLOCKER: Orval hook `useCreateSingleOffer` not yet generated (backend hasn't deployed offers endpoints).
// Replace with Orval-generated hook after `pnpm api:sync`.
export function useCreateSingleOffer() {
  return useMutation<CreateOfferResponse, Error, CreateSingleOfferRequest>({
    mutationFn: (data) =>
      customFetch<CreateOfferResponse>('/v1/offers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      const amount = parseFloat(variables.amount)
      const hasSpeedBonus =
        variables.speed_bonus !== undefined && variables.speed_bonus !== null
      trackOfferEvent('offer_sent', {
        actor_kind: 'brand',
        offer_type: 'single',
        platform: variables.platform,
        has_speed_bonus: hasSpeedBonus,
        amount_bucket: toAmountBucket(amount, 'USD'),
        deadline_days_from_now: daysFromNow(variables.deadline),
      })
    },
  })
}
