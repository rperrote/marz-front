import { useMutation, useQueryClient } from '@tanstack/react-query'

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
      void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
    },
  })
}
