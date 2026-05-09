import { keepPreviousData } from '@tanstack/react-query'

import { useGetCreatorEarnings } from '#/shared/api/generated/creator/creator'
import type {
  CreatorEarningsResponse,
  GetCreatorEarningsParams,
} from '#/shared/api/generated/model'

export type CreatorEarningsQueryInput = Required<
  Pick<GetCreatorEarningsParams, 'period'>
> &
  Pick<GetCreatorEarningsParams, 'q' | 'cursor' | 'limit'>

export function getCreatorEarningsQueryKey({
  period,
  q,
  cursor,
  limit,
}: CreatorEarningsQueryInput) {
  return ['creator-earnings', period, q, cursor, limit] as const
}

export function useCreatorEarningsQuery(input: CreatorEarningsQueryInput) {
  return useGetCreatorEarnings(input, {
    query: {
      queryKey: getCreatorEarningsQueryKey(input),
      placeholderData: keepPreviousData,
      select: (response): CreatorEarningsResponse => {
        if (response.status === 200) {
          return response.data
        }
        throw new Error('Unexpected creator earnings response')
      },
    },
  })
}
