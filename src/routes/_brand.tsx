import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'

import { AppShell } from '#/features/identity/app-shell/AppShell'
import { MissingWorkspaceFallback } from '#/features/identity/app-shell/MissingWorkspaceFallback'
import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import { getServerMe } from '#/shared/auth/getServerMe'
import type { ServerMeBody } from '#/shared/auth/getServerMe'
import { BrandSessionProvider } from '../features/identity/session/BrandSessionContext'

const STALE_TIME = 30_000

export const Route = createFileRoute('/_brand')({
  beforeLoad: async ({ context }) => {
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
      throw redirect({ to: '/auth' })
    }

    if (me.kind !== 'brand' && me.kind !== 'creator') {
      throw redirect({ to: '/auth' })
    }

    if (me.kind === 'creator') {
      throw redirect({ to: '/workspace' })
    }

    if (me.onboarding_status !== 'onboarded') {
      const destination = me.redirect_to ?? '/onboarding/brand'
      throw redirect({ to: destination })
    }

    return {
      accountId: me.id,
      hasBrandWorkspace: Boolean(me.brand_workspace),
      brandWorkspaceRole: me.membership?.role,
    }
  },
  component: BrandLayout,
})

function BrandLayout() {
  const { accountId, hasBrandWorkspace } = Route.useRouteContext()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  if (!hasBrandWorkspace) {
    return <MissingWorkspaceFallback />
  }

  return (
    <AppShell accountKind="brand" accountId={accountId} pathname={pathname}>
      <BrandSessionProvider>
        <Outlet />
      </BrandSessionProvider>
    </AppShell>
  )
}
