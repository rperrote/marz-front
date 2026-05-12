import { useRequestDraftChanges } from '#/shared/api/generated/deliverables/deliverables'

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
  const mutation = useRequestDraftChanges()

  const mutateAsync = (variables: {
    body: RequestChangesBody
    idempotencyKey: string
  }) =>
    mutation.mutateAsync({
      id: deliverableId,
      data: {
        categories: variables.body.categories,
        notes: variables.body.notes,
      },
    })

  return { ...mutation, mutateAsync }
}
