import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGetBriefProcessingQueryKey,
  processBrief,
} from '#/shared/api/generated/campaigns/campaigns'
import { ApiError } from '#/shared/api/mutator'

export function useProcessBrief() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (processingToken: string) => {
      return processBrief({ processing_token: processingToken })
    },
    onSuccess: (_data, processingToken) => {
      return queryClient.invalidateQueries({
        queryKey: getGetBriefProcessingQueryKey(processingToken),
      })
    },
  })
}

export function isProcessConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409
}
