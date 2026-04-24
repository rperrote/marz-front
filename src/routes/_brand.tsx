import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { track } from '#/shared/analytics/track'
import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import { getServerMe } from '#/shared/auth/getServerMe'
import type { ServerMeBody } from '#/shared/auth/getServerMe'
import { BrandShell } from '../features/identity/components/BrandShell'

const STALE_TIME = 30_000

export const Route = createFileRoute('/_brand')({
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

    if (me.onboarding_status !== 'onboarded') {
      const destination = me.redirect_to ?? '/auth'
      track('onboarding_redirect_enforced', {
        from: location.pathname,
        to: destination,
        reason: 'onboarding_incomplete',
      })
      throw redirect({ to: destination })
    }

    if (me.kind !== 'brand') {
      const home = me.kind === 'creator' ? '/offers' : '/auth'
      track('onboarding_redirect_enforced', {
        from: location.pathname,
        to: home,
        reason: 'kind_mismatch',
      })
      throw redirect({ to: home })
    }
  },
  component: BrandLayout,
})

function BrandLayout() {
  return (
    <BrandShell>
      <Outlet />
    </BrandShell>
  )
}
