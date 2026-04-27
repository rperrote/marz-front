import { createFileRoute } from '@tanstack/react-router'

import { ConversationView } from '#/features/chat/components/ConversationView'
import {
  fetchConversationDetail,
  fetchMessages,
  getConversationDetailQueryKey,
  getMessagesQueryKey,
} from '#/features/chat/queries'
import { ConversationOffersPanel } from '#/features/offers/components/ConversationOffersPanel'
import { useCanSendOffer } from '#/features/offers/hooks/useCanSendOffer'
import { useSendOfferSheetStore } from '#/features/offers/store/sendOfferSheetStore'

export const Route = createFileRoute(
  '/_brand/workspace/conversations/$conversationId',
)({
  loader: async ({ context, params }) => {
    const { queryClient } = context
    const { conversationId } = params

    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: getConversationDetailQueryKey(conversationId),
        queryFn: () => fetchConversationDetail(conversationId),
      }),
      queryClient.ensureQueryData({
        queryKey: getMessagesQueryKey(conversationId),
        queryFn: () => fetchMessages({ conversationId }),
      }),
    ]).catch(() => {
      // 404/403 handled by the component
    })
  },
  component: ConversationRoute,
})

function ConversationRoute() {
  const { conversationId } = Route.useParams()
  const { accountId, sessionKind } = Route.useRouteContext()
  const canSendOffer = useCanSendOffer({ conversationId })
  const openSheet = useSendOfferSheetStore((s) => s.open)

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden">
        <ConversationView
          conversationId={conversationId}
          currentAccountId={accountId}
          sessionKind={sessionKind}
          canSendOffer={canSendOffer}
          onSendOffer={() => openSheet(conversationId)}
        />
      </div>
      <ConversationOffersPanel conversationId={conversationId} />
    </div>
  )
}
