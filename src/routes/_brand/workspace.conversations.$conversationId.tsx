import { createFileRoute } from '@tanstack/react-router'

import { ConversationView } from '#/features/chat/components/ConversationView'
import {
  fetchConversationDetail,
  fetchMessages,
  getConversationDetailQueryKey,
  getMessagesQueryKey,
} from '#/features/chat/queries'

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
  const { accountId } = Route.useRouteContext()
  return (
    <ConversationView
      conversationId={conversationId}
      currentAccountId={accountId}
    />
  )
}
