import { useMutation, useQueryClient } from '@tanstack/react-query'

import { markOfferPaid } from '#/shared/api/generated/offers/offers'
import { generateIdempotencyKey } from '#/shared/api/idempotency'
import { getConversationDeliverablesQueryKey } from '#/shared/queries/deliverables'
import {
  getConversationOffersQueryKey,
  getOfferQueryKey,
} from '#/shared/queries/offers'

export interface MarkOfferPaidVariables {
  offerId: string
  conversationId: string
  amount: string
}

export function useMarkOfferPaidMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ offerId, amount }: MarkOfferPaidVariables) =>
      markOfferPaid(
        offerId,
        { amount },
        {
          headers: {
            'Idempotency-Key': generateIdempotencyKey(),
          },
        },
      ),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['offers', 'current', variables.conversationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['offers', 'list', variables.conversationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['offers', 'detail', variables.offerId],
        }),
        queryClient.invalidateQueries({
          queryKey: getConversationOffersQueryKey(variables.conversationId),
        }),
        queryClient.invalidateQueries({
          queryKey: getOfferQueryKey(variables.offerId),
        }),
        queryClient.invalidateQueries({
          queryKey: getConversationDeliverablesQueryKey(
            variables.conversationId,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: ['brand-payments-spending'],
        }),
        queryClient.invalidateQueries({ queryKey: ['creator-earnings'] }),
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
      ])
    },
  })
}
