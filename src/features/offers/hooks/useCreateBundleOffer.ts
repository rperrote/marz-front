import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateBundleOfferRequest as GeneratedCreateBundleOfferRequest } from '#/shared/api/generated/model'
import { createSingleOffer } from '#/shared/api/generated/offers/offers'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'

import {
  trackOfferEvent,
  toAmountBucket,
  daysFromNow,
  toPlatformMix,
} from '../analytics'

export type CreateBundleOfferRequest = GeneratedCreateBundleOfferRequest

export function useCreateBundleOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBundleOfferRequest) => createSingleOffer(data),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getConversationOffersQueryKey(variables.conversation_id),
        }),
        queryClient.invalidateQueries({
          queryKey: getMessagesQueryKey(variables.conversation_id),
        }),
      ])

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
