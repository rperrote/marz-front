import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { getMeQueryKey } from '#/shared/api/generated/accounts/accounts'
import type { meResponse } from '#/shared/api/generated/accounts/accounts'
import { track } from '#/shared/analytics/track'
import { getServerMe } from '#/shared/auth/getServerMe'
import type { ServerMeBody } from '#/shared/auth/getServerMe'

const STALE_TIME = 30_000

type OnboardingKind = 'brand' | 'creator'
type RouteMe = meResponse['data'] | ServerMeBody

interface OnboardingGuardOptions {
  queryClient: QueryClient
  kind: OnboardingKind
  routePath: `/onboarding/${OnboardingKind}`
  fallbackPath: '/campaigns' | '/offers'
}

export async function enforceOnboardingRoute({
  queryClient,
  kind,
  routePath,
  fallbackPath,
}: OnboardingGuardOptions) {
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

  if (me.kind !== kind) {
    throw redirect({ to: '/' })
  }

  if (me.onboarding_status !== 'onboarding_pending') {
    const destination =
      me.redirect_to && !me.redirect_to.startsWith(routePath)
        ? me.redirect_to
        : fallbackPath
    track('onboarding_redirect_enforced', { from: routePath, to: destination })
    throw redirect({ to: destination })
  }
}
