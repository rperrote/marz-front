import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'
import { customFetch, ApiError } from '#/shared/api/mutator'

interface AcceptOfferResponse {
  data: {
    id: string
    status: 'accepted'
    accepted_at: string
  }
  status: number
}

interface RejectOfferResponse {
  data: {
    id: string
    status: 'rejected'
    rejected_at: string
  }
  status: number
}

interface UseOfferActionsOptions {
  conversationId: string
}

// RAFITA:BLOCKER: Orval hooks `useAcceptOffer` / `useRejectOffer` not yet generated.
// Replace with Orval-generated hooks after `pnpm api:sync`.
// WS event deduplication is handled by the shared/ws/ layer, not this hook.
export function useOfferActions({ conversationId }: UseOfferActionsOptions) {
  const queryClient = useQueryClient()

  const offersQueryKey = ['conversations', conversationId, 'offers'] as const

  const acceptMutation = useMutation<
    AcceptOfferResponse,
    Error,
    string,
    { snapshot: unknown }
  >({
    mutationFn: (offerId) =>
      customFetch<AcceptOfferResponse>(`/v1/offers/${offerId}/accept`, {
        method: 'POST',
      }),
    onMutate: async (offerId) => {
      await queryClient.cancelQueries({ queryKey: offersQueryKey })
      const snapshot = queryClient.getQueryData(offersQueryKey)
      queryClient.setQueryData(offersQueryKey, (old: unknown) => {
        if (!Array.isArray(old)) return old
        return old.map((offer: Record<string, unknown>) =>
          offer.id === offerId ? { ...offer, status: 'accepted' } : offer,
        )
      })
      return { snapshot }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offersQueryKey })
    },
    onError: (error, _offerId, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(offersQueryKey, context.snapshot)
      }
      if (error instanceof ApiError && error.status === 409) {
        toast.error(t`Offer expired`)
        queryClient.invalidateQueries({ queryKey: offersQueryKey })
        return
      }
      toast.error(t`Something went wrong. Try again.`)
    },
  })

  const rejectMutation = useMutation<
    RejectOfferResponse,
    Error,
    { offerId: string; reason?: string },
    { snapshot: unknown }
  >({
    mutationFn: ({ offerId, reason }) =>
      customFetch<RejectOfferResponse>(`/v1/offers/${offerId}/reject`, {
        method: 'POST',
        body: reason ? JSON.stringify({ reason }) : undefined,
      }),
    onMutate: async ({ offerId }) => {
      await queryClient.cancelQueries({ queryKey: offersQueryKey })
      const snapshot = queryClient.getQueryData(offersQueryKey)
      queryClient.setQueryData(offersQueryKey, (old: unknown) => {
        if (!Array.isArray(old)) return old
        return old.map((offer: Record<string, unknown>) =>
          offer.id === offerId ? { ...offer, status: 'rejected' } : offer,
        )
      })
      return { snapshot }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offersQueryKey })
    },
    onError: (error, _vars, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(offersQueryKey, context.snapshot)
      }
      if (error instanceof ApiError && error.status === 409) {
        toast.error(t`Offer is no longer actionable`)
        queryClient.invalidateQueries({ queryKey: offersQueryKey })
        return
      }
      toast.error(t`Something went wrong. Try again.`)
    },
  })

  return {
    accept: acceptMutation,
    reject: rejectMutation,
    isActing: acceptMutation.isPending || rejectMutation.isPending,
  }
}
