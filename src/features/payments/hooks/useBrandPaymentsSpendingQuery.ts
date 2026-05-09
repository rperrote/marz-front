import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getBrandPaymentsSpending } from '../api/getBrandPaymentsSpending'
import { normalizeBrandPaymentsFilters } from '../api/brandPaymentsSchemas'
import type {
  BrandPaymentsSearch,
  BrandPaymentsSpendingResponse,
} from '../api/brandPaymentsSchemas'
import { useBrandSession } from '#/features/identity/session/BrandSessionContext'

const STALE_TIME_MS = 5 * 60 * 1000

export interface UseBrandPaymentsSpendingQueryInput {
  filters: BrandPaymentsSearch
  cursor?: string
}

export function getBrandPaymentsSpendingQueryKey(
  workspaceId: string,
  input: UseBrandPaymentsSpendingQueryInput,
) {
  return [
    'brand-payments-spending',
    workspaceId,
    {
      ...normalizeBrandPaymentsFilters(input.filters),
      ...(input.cursor ? { cursor: input.cursor } : {}),
    },
  ] as const
}

export function useBrandPaymentsSpendingQuery(
  input: UseBrandPaymentsSpendingQueryInput,
) {
  const { brandWorkspace } = useBrandSession()
  const workspaceId = brandWorkspace.id
  const filters = normalizeBrandPaymentsFilters(input.filters)

  return useQuery<BrandPaymentsSpendingResponse>({
    queryKey: getBrandPaymentsSpendingQueryKey(workspaceId, input),
    queryFn: ({ signal }) =>
      getBrandPaymentsSpending({
        data: {
          ...filters,
          workspaceId,
          ...(input.cursor ? { cursor: input.cursor } : {}),
        },
        signal,
      }),
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })
}
