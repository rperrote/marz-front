import { useMutation } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'

// RAFITA:BLOCKER: Backend dev (localhost:8080) does not yet expose deliverable/
// request-changes endpoints in the OpenAPI spec. These hooks are manual stubs;
// replace with Orval generated hooks once `pnpm api:sync` pulls the extended contract.

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

export function useRequestChangesMutation(
  deliverableId: string,
  draftId: string,
) {
  return useMutation<
    RequestChangesResponse,
    Error,
    { body: RequestChangesBody; idempotencyKey: string }
  >({
    mutationFn: ({ body, idempotencyKey }) =>
      customFetch<RequestChangesResponse>(
        `/v1/deliverables/${encodeURIComponent(deliverableId)}/drafts/${encodeURIComponent(draftId)}/request-changes`,
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
