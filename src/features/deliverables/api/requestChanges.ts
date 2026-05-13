import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getListChangeRequestsQueryKey,
  requestDraftChanges,
} from '#/shared/api/generated/deliverables/deliverables'
import { withIdempotencyKey } from '#/shared/api/idempotency'

export type ChangeCategory =
  | 'product_placement'
  | 'pacing'
  | 'audio'
  | 'discount_code'
  | 'other'

export interface RequestChangesBody {
  categories: ChangeCategory[]
  notes: string
}

export function useRequestChangesMutation(deliverableId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: {
      body: RequestChangesBody
      idempotencyKey: string
    }) =>
      requestDraftChanges(
        deliverableId,
        {
          categories: variables.body.categories,
          notes: variables.body.notes,
        },
        withIdempotencyKey(variables.idempotencyKey),
      ),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: getListChangeRequestsQueryKey(deliverableId),
      })
    },
  })
}
