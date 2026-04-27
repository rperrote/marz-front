import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { track } from '#/shared/analytics/track'
import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import { getServerMe } from '#/shared/auth/getServerMe'
import type { ServerMeBody } from '#/shared/auth/getServerMe'
import { BrandShell } from '#/features/identity/components/BrandShell'
import { CreatorShell } from '#/features/identity/components/CreatorShell'
import { ConversationRail } from '#/features/chat/workspace/ConversationRail'
import { WorkspaceLayout } from '#/features/chat/workspace/WorkspaceLayout'
import {
  brandWorkspaceSearchSchema,
  creatorWorkspaceSearchSchema,
} from '#/features/chat/workspace/workspaceSearchSchema'

const STALE_TIME = 30_000

export const Route = createFileRoute('/workspace')({
  validateSearch: brandWorkspaceSearchSchema,
  beforeLoad: async ({ context, location }) => {
    const { queryClient } = context

    const cached = queryClient.getQueryData<meResponse>(getMeQueryKey())
    const cachedMe = cached && cached.status === 200 ? cached.data : undefined
    const cacheAge =
      queryClient.getQueryState(getMeQueryKey())?.dataUpdatedAt ?? 0
    const isFresh = cachedMe && Date.now() - cacheAge < STALE_TIME

    let me: ServerMeBody | null = null

    if (isFresh) {
      // RAFITA:ANY: meResponse.data y ServerMeBody difieren en shape generada vs manual
      me = cachedMe as unknown as ServerMeBody
    } else {
      const result = await getServerMe()
      if (result.ok) {
        me = result.body
        queryClient.setQueryData(
          getMeQueryKey(),
          // RAFITA:ANY: wrapping ServerMeBody como meResponse para el cache de react-query
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

    if (me.onboarding_status !== 'onboarded') {
      const destination = me.redirect_to ?? '/auth'
      track('onboarding_redirect_enforced', {
        from: location.pathname,
        to: destination,
        reason: 'onboarding_incomplete',
      })
      throw redirect({ to: destination })
    }

    if (me.kind !== 'brand' && me.kind !== 'creator') {
      throw redirect({ to: '/auth' })
    }

    return { accountKind: me.kind }
  },
  component: WorkspaceLayoutRoute,
})

function WorkspaceLayoutRoute() {
  const { accountKind } = Route.useRouteContext()
  const rawSearch = Route.useSearch()

  const search =
    accountKind === 'creator'
      ? creatorWorkspaceSearchSchema.parse(rawSearch)
      : rawSearch

  const Shell = accountKind === 'brand' ? BrandShell : CreatorShell

  return (
    <Shell>
      <WorkspaceLayout rail={<ConversationRail search={search} />}>
        <Outlet />
      </WorkspaceLayout>
    </Shell>
  )
}
