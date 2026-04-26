import { useMutation } from '@tanstack/react-query'
import { customFetch, ApiError } from '#/shared/api/mutator'

interface ProcessBriefResponse {
  data: unknown
  status: number
  headers: Headers
}

export function useProcessBrief() {
  return useMutation({
    mutationFn: async (processingToken: string) => {
      const result = await customFetch<ProcessBriefResponse>(
        '/api/v1/campaigns/brief-builder/process',
        {
          method: 'POST',
          body: JSON.stringify({ processing_token: processingToken }),
        },
      )
      return result
    },
  })
}

export function isProcessConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409
}
