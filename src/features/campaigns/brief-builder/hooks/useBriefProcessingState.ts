import { useQuery } from '@tanstack/react-query'
import {
  getBriefProcessing,
  getGetBriefProcessingQueryKey,
} from '#/shared/api/generated/campaigns/campaigns'
import type { BriefProcessingStateResponse } from '#/shared/api/generated/model'
import { ApiError } from '#/shared/api/mutator'

export type BriefProcessingState =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'partial'
  | 'expired'

export interface BriefProcessingStateResult {
  state: BriefProcessingState | null
  data: BriefProcessingStateResponse | null
  isLoading: boolean
}

export function useBriefProcessingState(
  token: string | null,
): BriefProcessingStateResult {
  const query = useQuery({
    queryKey: token
      ? getGetBriefProcessingQueryKey(token)
      : ['brief-processing-disabled'],
    queryFn: async () => {
      const res = (await getBriefProcessing(token!)) as {
        data: BriefProcessingStateResponse
      }
      return res.data
    },
    enabled: token != null,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 2
    },
    staleTime: Infinity,
    gcTime: 0,
  })

  if (token == null) {
    return { state: null, data: null, isLoading: false }
  }

  if (query.error instanceof ApiError && query.error.status === 404) {
    return { state: 'expired', data: null, isLoading: false }
  }

  if (query.data) {
    return {
      state: query.data.state as BriefProcessingState,
      data: query.data,
      isLoading: false,
    }
  }

  return { state: null, data: null, isLoading: query.isLoading }
}
