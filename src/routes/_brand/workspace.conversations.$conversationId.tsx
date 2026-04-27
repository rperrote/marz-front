import { createFileRoute } from '@tanstack/react-router'

import { ConversationView } from '#/features/chat/components/ConversationView'
import {
  fetchConversationDetail,
  fetchMessages,
  getConversationDetailQueryKey,
  getMessagesQueryKey,
} from '#/features/chat/queries'
import {
  fetchConversationDeliverables,
  getConversationDeliverablesQueryKey,
} from '#/features/deliverables/api/conversationDeliverables'
import { DeliverableListPanel } from '#/features/deliverables/components/DeliverableListPanel'
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
      queryClient.ensureQueryData({
        queryKey: getConversationDeliverablesQueryKey(conversationId),
        queryFn: () => fetchConversationDeliverables(conversationId),
      }),
    ]).catch(() => {
      // 404/403 handled by the component
    })
  },
  component: ConversationRoute,
})

// RAFITA:BLOCKER: Creator workspace route at the same /workspace/... paths cannot
// coexist with brand workspace routes in TanStack Router file-based routing
// (both _brand and _creator are pathless layouts; duplicate full paths are rejected).
// To mount DeliverableListPanel for creators, unify workspace routes into a single
// kind-agnostic layout (e.g. src/routes/workspace.tsx) or use distinct paths.
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
      <aside className="flex w-[340px] shrink-0 flex-col border-l border-border bg-background">
        <DeliverableListPanel
          conversationId={conversationId}
          sessionKind={sessionKind}
        />
      </aside>
    </div>
  )
}
