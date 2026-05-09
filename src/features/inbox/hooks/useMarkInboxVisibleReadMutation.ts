import { useMutation, useQueryClient } from '@tanstack/react-query'

import { inboxQueryKey, markInboxVisibleRead } from '../api/inbox'
import type {
  MarkInboxVisibleReadInput,
  MarkInboxVisibleReadResponse,
} from '../api/inbox'

export function useMarkInboxVisibleReadMutation() {
  const queryClient = useQueryClient()

  return useMutation<
    MarkInboxVisibleReadResponse,
    Error,
    MarkInboxVisibleReadInput
  >({
    mutationFn: markInboxVisibleRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inboxQueryKey })
    },
  })
}
