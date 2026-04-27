import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { customFetch } from '#/shared/api/mutator'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'
import type { OfferStatus, OfferSpeedBonus } from '#/features/offers/types'

export { getConversationOffersQueryKey }

export interface ConversationOfferDTO {
  id: string
  campaign_id: string
  campaign_name: string
  brand_workspace_id: string
  creator_account_id: string
  type: 'single'
  status: OfferStatus
  total_amount: string
  currency: string
  deadline: string
  speed_bonus: OfferSpeedBonus | null
  sent_at: string
  expires_at: string
  accepted_at: string | null
  rejected_at: string | null
  deliverables: Array<{
    id: string
    platform: string
    format: string
    quantity: number
    amount: string
  }>
}

export interface ArchiveOfferItem {
  id: string
  status: OfferStatus
  total_amount: string
  currency: string
  sent_at: string
  campaign_name: string
}

export interface ConversationOffersResponse {
  current: ConversationOfferDTO | null
  archive: {
    items: ArchiveOfferItem[]
    next_cursor: string | null
  }
}

interface ApiResponse {
  data: ConversationOffersResponse
  status: number
}

async function fetchConversationOffers(
  conversationId: string,
  cursor?: string,
): Promise<ConversationOffersResponse> {
  const params = new URLSearchParams()
  if (cursor) {
    params.set('cursor', cursor)
  }
  const qs = params.toString()
  const url = `/v1/conversations/${encodeURIComponent(conversationId)}/offers${qs ? `?${qs}` : ''}`
  const response = await customFetch<ApiResponse>(url)
  return response.data
}

export function useConversationOffersPaginated(conversationId: string) {
  const infiniteQuery = useInfiniteQuery<ConversationOffersResponse>({
    queryKey: getConversationOffersQueryKey(conversationId),
    queryFn: ({ pageParam }) =>
      fetchConversationOffers(conversationId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.archive.next_cursor ?? undefined,
    staleTime: 30_000,
  })

  const current = infiniteQuery.data?.pages[0]?.current ?? null

  const archiveItems = useMemo(() => {
    if (!infiniteQuery.data?.pages) return []
    return infiniteQuery.data.pages.flatMap((page) => page.archive.items)
  }, [infiniteQuery.data?.pages])

  const lastPage =
    infiniteQuery.data?.pages[infiniteQuery.data.pages.length - 1]
  const nextCursor = lastPage?.archive.next_cursor ?? null

  return {
    current,
    archiveItems,
    nextCursor,
    fetchNextPage: () => void infiniteQuery.fetchNextPage(),
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
  }
}
