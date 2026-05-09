import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'

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
}

export function getBrandPaymentsSpendingQueryKey(
  workspaceId: string,
  input: UseBrandPaymentsSpendingQueryInput,
) {
  return [
    'brand-payments-spending',
    workspaceId,
    normalizeBrandPaymentsFilters(input.filters),
  ] as const
}

export function useBrandPaymentsSpendingQuery(
  input: UseBrandPaymentsSpendingQueryInput,
) {
  const { brandWorkspace } = useBrandSession()
  const workspaceId = brandWorkspace.id
  const filters = normalizeBrandPaymentsFilters(input.filters)

  return useInfiniteQuery<BrandPaymentsSpendingResponse>({
    queryKey: getBrandPaymentsSpendingQueryKey(workspaceId, input),
    queryFn: ({ pageParam, signal }) =>
      getBrandPaymentsSpending({
        data: {
          ...filters,
          workspaceId,
          ...(pageParam ? { cursor: pageParam as string } : {}),
        },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.payments.next_cursor ?? undefined,
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })
}
