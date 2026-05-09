import { t } from '@lingui/core/macro'
import {
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

export const Route = createFileRoute('/inbox')({
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

    if (me.onboarding_status !== 'onboarded') {
      const destination = me.redirect_to ?? `/onboarding/${me.kind}`
      throw redirect({ to: destination })
    }

    const sessionKind: 'brand' | 'creator' = me.kind

    return {
      accountId: me.id,
      sessionKind,
    }
  },
  component: InboxRoute,
})

function InboxRoute() {
  const { accountId, sessionKind } = Route.useRouteContext()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <AppShell
      accountKind={sessionKind}
      accountId={accountId}
      pathname={pathname}
    >
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {t`Inbox estará disponible pronto.`}
        </p>
      </div>
    </AppShell>
  )
}
