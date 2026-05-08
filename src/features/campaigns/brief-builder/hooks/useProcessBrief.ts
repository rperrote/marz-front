import { useMutation } from '@tanstack/react-query'
import { processBrief } from '#/shared/api/generated/campaigns/campaigns'
import { ApiError } from '#/shared/api/mutator'

export function useProcessBrief() {
  return useMutation({
    mutationFn: async (processingToken: string) => {
      return processBrief({ processing_token: processingToken })
    },
  })
}

export function isProcessConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409
}
