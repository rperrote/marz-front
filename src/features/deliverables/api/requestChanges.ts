import { useMutation } from '@tanstack/react-query'

import { requestDraftChanges } from '#/shared/api/generated/deliverables/deliverables'
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
  })
}
