import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getConversationOffers } from '#/shared/api/generated/offers/offers'
import { getConversationOffersQueryKey } from '#/shared/queries/offers'
import type {
  ArchivedOfferItem,
  ConversationOffersResponse,
  OfferDTO,
} from '#/shared/api/generated/model'

export { getConversationOffersQueryKey }
export type { ArchivedOfferItem, OfferDTO }

async function fetchConversationOffers(
  conversationId: string,
  cursor?: string,
): Promise<ConversationOffersResponse> {
  const response = await getConversationOffers(
    conversationId,
    cursor ? { cursor } : undefined,
  )
  if (response.status !== 200) {
    throw new Error(`Unexpected status ${response.status}`)
  }
  return response.data
}

export function useConversationOffersPaginated(conversationId: string) {
  const infiniteQuery = useInfiniteQuery<ConversationOffersResponse>({
    queryKey: getConversationOffersQueryKey(conversationId),
    queryFn: ({ pageParam }) =>
      fetchConversationOffers(conversationId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 30_000,
  })

  const current = infiniteQuery.data?.pages[0]?.current ?? null

  const archiveItems = useMemo(() => {
    if (!infiniteQuery.data?.pages) return []
    return infiniteQuery.data.pages.flatMap((page) => page.archive)
  }, [infiniteQuery.data?.pages])

  const lastPage =
    infiniteQuery.data?.pages[infiniteQuery.data.pages.length - 1]
  const nextCursor = lastPage?.next_cursor ?? null

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
