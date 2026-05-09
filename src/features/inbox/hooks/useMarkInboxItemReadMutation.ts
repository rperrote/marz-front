import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '#/shared/api/mutator'

import { inboxQueryKey, markInboxItemRead } from '../api/inbox'
import type {
  MarkInboxItemReadInput,
  MarkInboxItemReadResponse,
} from '../api/inbox'

export function useMarkInboxItemReadMutation() {
  const queryClient = useQueryClient()

  return useMutation<MarkInboxItemReadResponse, Error, MarkInboxItemReadInput>({
    mutationFn: markInboxItemRead,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: inboxQueryKey })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        return queryClient.invalidateQueries({ queryKey: inboxQueryKey })
      }

      return undefined
    },
  })
}
