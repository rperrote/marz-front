import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'

import { AppShell } from '#/features/identity/app-shell/AppShell'
import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import { getServerMe } from '#/shared/auth/getServerMe'
import type { ServerMeBody } from '#/shared/auth/getServerMe'

const STALE_TIME = 30_000
type RouteMe = meResponse['data'] | ServerMeBody

export const Route = createFileRoute('/_creator')({
  beforeLoad: async ({ context }) => {
    const { queryClient } = context

    const cached = queryClient.getQueryData<meResponse>(getMeQueryKey())
    const cachedMe = cached && cached.status === 200 ? cached.data : undefined
    const cacheAge =
      queryClient.getQueryState(getMeQueryKey())?.dataUpdatedAt ?? 0
    const isFresh = cachedMe && Date.now() - cacheAge < STALE_TIME

    let me: RouteMe | null = null

    if (isFresh) {
      me = cachedMe
    } else {
      const result = await getServerMe()
      if (result.ok) {
        me = result.body
        queryClient.setQueryData(
          getMeQueryKey(),
          { data: me, status: 200 },
          { updatedAt: Date.now() },
        )
      }
    }

    if (!me) {
      throw redirect({ to: '/auth' })
    }

    if (me.kind !== 'brand' && me.kind !== 'creator') {
      throw redirect({ to: '/auth' })
    }

    if (me.kind === 'brand') {
      throw redirect({ to: '/workspace' })
    }

    if (me.onboarding_status !== 'onboarded') {
      const destination = me.redirect_to ?? '/onboarding/creator'
      throw redirect({ to: destination })
    }

    // TODO: pass creator display_name once ServerMeBody exposes creator_profile
    return {
      accountId: me.id,
    }
  },
  component: CreatorLayout,
})

function CreatorLayout() {
  const { accountId } = Route.useRouteContext()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <AppShell accountKind="creator" accountId={accountId} pathname={pathname}>
      <Outlet />
    </AppShell>
  )
}
