import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useParams,
  useRouterState,
} from '@tanstack/react-router'
import { useCallback } from 'react'

import { AppShell } from '#/features/identity/app-shell/AppShell'
import { track } from '#/shared/analytics/track'
import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import { getServerMe } from '#/shared/auth/getServerMe'
import type { ServerMeBody } from '#/shared/auth/getServerMe'
import { ConversationRail } from '#/features/chat/workspace/ConversationRail'
import { WorkspaceLayout } from '#/features/chat/workspace/WorkspaceLayout'
import { workspaceSearchSchema } from '#/features/chat/workspace/workspaceSearchSchema'

const STALE_TIME = 30_000

export const Route = createFileRoute('/workspace')({
  validateSearch: workspaceSearchSchema,
  beforeLoad: async ({ context, location }) => {
    const { queryClient } = context

    const cached = queryClient.getQueryData<meResponse>(getMeQueryKey())
    const cachedMe = cached && cached.status === 200 ? cached.data : undefined
    const cacheAge =
      queryClient.getQueryState(getMeQueryKey())?.dataUpdatedAt ?? 0
    const isFresh = cachedMe && Date.now() - cacheAge < STALE_TIME

    let me: ServerMeBody | null = null

    if (isFresh) {
      me = cachedMe as unknown as ServerMeBody
    } else {
      const result = await getServerMe()
      if (result.ok) {
        me = result.body
        queryClient.setQueryData(
          getMeQueryKey(),
          { data: me, status: 200 } as unknown as meResponse,
          { updatedAt: Date.now() },
        )
      }
    }

    if (!me) {
      track('onboarding_redirect_enforced', {
        from: location.pathname,
        to: '/auth',
        reason: 'no_session',
      })
      throw redirect({ to: '/auth' })
    }

    if (me.kind !== 'brand' && me.kind !== 'creator') {
      throw redirect({ to: '/auth' })
    }

    if (me.onboarding_status !== 'onboarded') {
      const destination = me.redirect_to ?? '/auth'
      track('onboarding_redirect_enforced', {
        from: location.pathname,
        to: destination,
        reason: 'onboarding_incomplete',
      })
      throw redirect({ to: destination })
    }

    const sessionKind: 'brand' | 'creator' = me.kind
    return {
      accountId: me.id,
      sessionKind,
      viewerRole: sessionKind === 'brand' ? me.membership?.role : undefined,
    }
  },
  component: WorkspaceRoute,
})

function WorkspaceRoute() {
  const search = Route.useSearch()
  const { accountId, sessionKind } = Route.useRouteContext()
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

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
    <AppShell
      accountKind={sessionKind}
      accountId={accountId}
      pathname={pathname}
    >
      <WorkspaceLayout
        sessionKind={sessionKind}
        rail={
          <ConversationRail
            search={search}
            sessionKind={sessionKind}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
          />
        }
      >
        <Outlet />
      </WorkspaceLayout>
    </AppShell>
  )
}
