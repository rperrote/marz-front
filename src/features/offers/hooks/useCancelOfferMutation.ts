import { useMutation, useQueryClient } from '@tanstack/react-query'

import { customFetch } from '#/shared/api/mutator'
import { generateIdempotencyKey } from '#/shared/api/idempotency'
import { getConversationDeliverablesQueryKey } from '#/shared/queries/deliverables'
import {
  getConversationOffersQueryKey,
  getOfferQueryKey,
} from '#/shared/queries/offers'

export interface CancelOfferVariables {
  offerId: string
  conversationId: string
}

interface CancelOfferResponse {
  data: unknown
  status: number
  headers: Headers
}

function getCancelOfferUrl(offerId: string) {
  return `/v1/offers/${offerId}/cancel`
}

export function useCancelOfferMutation() {
  const queryClient = useQueryClient()

  return useMutation<CancelOfferResponse, Error, CancelOfferVariables>({
    mutationFn: ({ offerId }) =>
      customFetch<CancelOfferResponse>(getCancelOfferUrl(offerId), {
        method: 'POST',
        headers: {
          'Idempotency-Key': generateIdempotencyKey(),
        },
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
      ])
    },
  })
}
