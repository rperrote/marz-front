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

// RAFITA:BLOCKER: src/shared/api/generated does not expose list-links yet.
// Replace this manual query with the Orval hook once api:sync includes it.
export async function fetchDeliverableLinks(
  deliverableId: string,
): Promise<DeliverableLinksResponse> {
  const response = await customFetch<ApiResponse<DeliverableLinksResponse>>(
    `/v1/deliverables/${encodeURIComponent(deliverableId)}/links`,
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
