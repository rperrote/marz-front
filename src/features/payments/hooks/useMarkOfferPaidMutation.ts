import { useMutation, useQueryClient } from '@tanstack/react-query'

import { customFetch } from '#/shared/api/mutator'
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

interface MarkOfferPaidResponse {
  data: unknown
  status: number
  headers: Headers
}

function getMarkOfferPaidUrl(offerId: string) {
  return `/v1/offers/${offerId}/mark-as-paid`
}

export function useMarkOfferPaidMutation() {
  const queryClient = useQueryClient()

  return useMutation<MarkOfferPaidResponse, Error, MarkOfferPaidVariables>({
    mutationFn: ({ offerId, amount }) =>
      customFetch<MarkOfferPaidResponse>(getMarkOfferPaidUrl(offerId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': generateIdempotencyKey(),
        },
        body: JSON.stringify({ amount }),
      }),
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
