import { useMutation } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'

// RAFITA:BLOCKER: el backend todavía no expone POST /v1/deliverables/{id}/request-changes
// (sin draft_id en path — el backend resuelve el current draft internamente).
// Cuando esté en el spec, migrar a Orval con pnpm api:sync.

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

interface RequestChangesResponse {
  data: {
    change_request_id: string
    status: string
  }
  status: number
}

export function useRequestChangesMutation(deliverableId: string) {
  return useMutation<
    RequestChangesResponse,
    Error,
    { body: RequestChangesBody; idempotencyKey: string }
  >({
    mutationFn: ({ body, idempotencyKey }) =>
      customFetch<RequestChangesResponse>(
        `/v1/deliverables/${encodeURIComponent(deliverableId)}/request-changes`,
        {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        },
      ),
  })
}
