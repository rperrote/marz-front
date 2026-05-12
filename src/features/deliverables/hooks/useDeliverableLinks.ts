import { useQuery } from '@tanstack/react-query'

import { customFetch } from '#/shared/api/mutator'
import type { DeliverableLinksResponse } from '#/features/deliverables/types'

type ApiResponse<T> = { data: T; status: number }

interface UseDeliverableLinksOptions {
  enabled?: boolean
}

export function getDeliverableLinksQueryKey(deliverableId: string) {
  return ['deliverable', deliverableId, 'links'] as const
}

// El endpoint vive en GET /v1/links?deliverable_id={id}. Cuando esté en el
// spec, migrar a Orval con pnpm api:sync.
export async function fetchDeliverableLinks(
  deliverableId: string,
): Promise<DeliverableLinksResponse> {
  const response = await customFetch<ApiResponse<DeliverableLinksResponse>>(
    `/v1/links?deliverable_id=${encodeURIComponent(deliverableId)}`,
  )
  return response.data
}

export function useDeliverableLinks(
  deliverableId: string,
  options?: UseDeliverableLinksOptions,
) {
  return useQuery<DeliverableLinksResponse>({
    queryKey: getDeliverableLinksQueryKey(deliverableId),
    queryFn: () => fetchDeliverableLinks(deliverableId),
    enabled: (options?.enabled ?? true) && !!deliverableId,
    staleTime: 5_000,
  })
}
