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

function makeQueryClient(): any {
  return {
    getQueryData: vi.fn(() => undefined),
    getQueryState: vi.fn(() => undefined),
    setQueryData: vi.fn(),
  }
}

async function callBeforeLoad(
  pathname = '/_creator/offers',
  queryClient = makeQueryClient(),
) {
  const { Route } = await import('./_creator')
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: (opts: {
        context: { queryClient: ReturnType<typeof makeQueryClient> }
        location: { pathname: string }
      }) => Promise<void>
    }
  ).beforeLoad
  return beforeLoad({ context: { queryClient }, location: { pathname } })
}

describe('/_creator beforeLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerMeResult = { ok: false, body: null }
  })

  it('redirects to /auth when not authenticated', async () => {
    mockServerMeResult = { ok: false, body: null }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('redirects to redirect_to when onboarding incomplete', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'creator',
        onboarding_status: 'onboarding_pending',
        redirect_to: '/onboarding/creator',
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/onboarding/creator' }),
    )
  })

  it('redirects to /auth when onboarding incomplete and no redirect_to', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'creator',
        onboarding_status: 'kind_pending',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('redirects to /campaigns when kind is brand', async () => {
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

  it('redirects to /auth when kind is null', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: null,
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('does not redirect when kind is creator and onboarded', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).resolves.toBeUndefined()
  })

  it('fires onboarding_redirect_enforced analytics', async () => {
    const { track } = await import('#/shared/analytics/track')
    mockServerMeResult = { ok: false, body: null }
    try {
      await callBeforeLoad('/_creator/offers')
    } catch {
      // redirect thrown
    }
    expect(track).toHaveBeenCalledWith('onboarding_redirect_enforced', {
      from: '/_creator/offers',
      to: '/auth',
      reason: 'no_session',
    })
  })

  it('uses cached queryClient data when fresh', async () => {
    const qc = makeQueryClient()
    qc.getQueryData.mockReturnValue({
      status: 200,
      data: {
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    })
    qc.getQueryState.mockReturnValue({ dataUpdatedAt: Date.now() })

    await expect(
      callBeforeLoad('/_creator/offers', qc),
    ).resolves.toBeUndefined()
  })

  it('seeds queryClient after fetching from server', async () => {
    const qc = makeQueryClient()
    mockServerMeResult = {
      ok: true,
      body: {
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    await callBeforeLoad('/_creator/offers', qc)
    expect(qc.setQueryData).toHaveBeenCalledWith(
      ['/v1/me'],
      expect.objectContaining({ status: 200 }),
      expect.any(Object),
    )
  })
})
