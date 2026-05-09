import { useQuery } from '@tanstack/react-query'

import { getInbox, getInboxQueryKey } from '../api/inbox'
import type { InboxResponse } from '../api/inbox'

interface UseInboxQueryOptions {
  campaignId?: string | null
}

export function useInboxQuery({ campaignId }: UseInboxQueryOptions = {}) {
  return useQuery<InboxResponse>({
    queryKey: getInboxQueryKey(campaignId),
    queryFn: () =>
      getInbox({ data: campaignId ? { campaign_id: campaignId } : {} }),
  })
}
