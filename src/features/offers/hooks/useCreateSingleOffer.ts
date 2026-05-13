import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateSingleOfferRequest as GeneratedCreateSingleOfferRequest } from '#/shared/api/generated/model'
import { createSingleOffer } from '#/shared/api/generated/offers/offers'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'

import { trackOfferEvent, toAmountBucket, daysFromNow } from '../analytics'

export type CreateSingleOfferRequest = GeneratedCreateSingleOfferRequest

export function useCreateSingleOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSingleOfferRequest) => createSingleOffer(data),
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
        offer_type: 'single',
        platform_mix: [variables.deliverable.platform],
        has_bonus_terms: hasBonusTerms,
        total_amount_bucket: toAmountBucket(amount, 'USD'),
        deadline_days_from_now: daysFromNow(variables.deadline),
      })
    },
  })
}
