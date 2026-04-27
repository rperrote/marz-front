import {
  Outlet,
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import { useCallback } from 'react'

import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import type { ServerMeBody } from '#/shared/auth/getServerMe'
import { ConversationRail } from '#/features/chat/workspace/ConversationRail'
import { WorkspaceLayout } from '#/features/chat/workspace/WorkspaceLayout'
import { workspaceSearchSchema } from '#/features/chat/workspace/workspaceSearchSchema'

export const Route = createFileRoute('/_brand/workspace')({
  validateSearch: workspaceSearchSchema,
  beforeLoad: ({ context }) => {
    const { queryClient } = context
    const cached = queryClient.getQueryData<meResponse>(getMeQueryKey())
    const me =
      cached && cached.status === 200
        ? (cached.data as unknown as ServerMeBody)
        : null
    return { accountId: me?.id ?? '' }
  },
  component: BrandWorkspaceLayout,
})

function BrandWorkspaceLayout() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const { conversationId: activeConversationId } = useParams({
    strict: false,
    select: (params) => ({
      conversationId: (params as { conversationId?: string }).conversationId,
    }),
  })

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      void navigate({
        to: '/workspace/conversations/$conversationId',
        params: { conversationId },
        search,
      })
    },
    [navigate, search],
  )

  return (
    <WorkspaceLayout
      rail={
        <ConversationRail
          search={search}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
        />
      }
    >
      <Outlet />
    </WorkspaceLayout>
  )
}
