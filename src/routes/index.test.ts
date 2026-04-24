import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from '@tanstack/react-router'

let mockServerMeResult: { ok: boolean; body: Record<string, unknown> | null } =
  { ok: false, body: null }

vi.mock('#/shared/auth/getServerMe', () => ({
  getServerMe: () => Promise.resolve(mockServerMeResult),
}))

vi.mock('#/shared/analytics/track', () => ({
  track: vi.fn(),
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  getMeQueryKey: () => ['/v1/me'],
}))

function makeQueryClient() {
  return {
    getQueryData: vi.fn(() => undefined),
    getQueryState: vi.fn(() => undefined),
    setQueryData: vi.fn(),
  }
}

async function callBeforeLoad(queryClient = makeQueryClient()) {
  const { Route } = await import('./index')
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: (opts: {
        context: { queryClient: ReturnType<typeof makeQueryClient> }
      }) => Promise<void>
    }
  ).beforeLoad
  return beforeLoad({ context: { queryClient } })
}

describe('/ beforeLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerMeResult = { ok: false, body: null }
  })

  it('redirects to /auth when not authenticated', async () => {
    mockServerMeResult = { ok: false, body: null }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('fires analytics when not authenticated', async () => {
    const { track } = await import('#/shared/analytics/track')
    mockServerMeResult = { ok: false, body: null }
    try {
      await callBeforeLoad()
    } catch {
      // redirect thrown
    }
    expect(track).toHaveBeenCalledWith('onboarding_redirect_enforced', {
      from: '/',
      to: '/auth',
      reason: 'no_session',
    })
  })

  it('redirects to redirect_to when onboarding incomplete', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: null,
        onboarding_status: 'kind_pending',
        redirect_to: '/auth/kind',
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/auth/kind' }),
    )
  })

  it('redirects to /auth when onboarding incomplete and no redirect_to', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: null,
        onboarding_status: 'kind_pending',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('redirects to /campaigns for onboarded brand', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/campaigns' }),
    )
  })

  it('redirects to /offers for onboarded creator', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/offers' }))
  })
})
