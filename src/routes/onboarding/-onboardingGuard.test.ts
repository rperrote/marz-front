import { redirect } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerMeMock = vi.hoisted(() => vi.fn())
const trackMock = vi.hoisted(() => vi.fn())

vi.mock('#/shared/auth/getServerMe', () => ({
  getServerMe: getServerMeMock,
}))

vi.mock('#/shared/analytics/track', () => ({
  track: trackMock,
}))

vi.mock('#/shared/api/generated/accounts/accounts', () => ({
  getMeQueryKey: () => ['/v1/me'],
}))

interface QueryClientMock {
  getQueryData: ReturnType<typeof vi.fn>
  getQueryState: ReturnType<typeof vi.fn>
  setQueryData: ReturnType<typeof vi.fn>
}

function makeQueryClient(): QueryClientMock {
  return {
    getQueryData: vi.fn(() => undefined),
    getQueryState: vi.fn(() => undefined),
    setQueryData: vi.fn(),
  }
}

function makeMe(overrides: Record<string, unknown> = {}) {
  return {
    id: 'acct_brand_1',
    kind: 'brand',
    onboarding_status: 'onboarding_pending',
    redirect_to: null,
    ...overrides,
  }
}

function enforceBrand(queryClient = makeQueryClient()) {
  return import('./-onboardingGuard').then(({ enforceOnboardingRoute }) =>
    enforceOnboardingRoute({
      queryClient: queryClient as never,
      kind: 'brand',
      routePath: '/onboarding/brand',
      fallbackPath: '/campaigns',
    }),
  )
}

describe('enforceOnboardingRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('uses fresh cached me data without calling getServerMe', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_778_628_000_000)
    const queryClient = makeQueryClient()
    queryClient.getQueryData.mockReturnValue({
      status: 200,
      data: makeMe(),
    })
    queryClient.getQueryState.mockReturnValue({
      dataUpdatedAt: 1_778_627_999_000,
    })

    await expect(enforceBrand(queryClient)).resolves.toBeUndefined()

    expect(getServerMeMock).not.toHaveBeenCalled()
    expect(queryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('fetches and caches me data when the cache is absent', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_778_628_000_000)
    const queryClient = makeQueryClient()
    const me = makeMe()
    getServerMeMock.mockResolvedValue({ ok: true, body: me })

    await expect(enforceBrand(queryClient)).resolves.toBeUndefined()

    expect(getServerMeMock).toHaveBeenCalledTimes(1)
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      ['/v1/me'],
      { data: me, status: 200 },
      { updatedAt: 1_778_628_000_000 },
    )
  })

  it('fetches and caches me data when the cache is stale', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_778_628_000_000)
    const queryClient = makeQueryClient()
    const me = makeMe({ id: 'acct_brand_fresh' })
    queryClient.getQueryData.mockReturnValue({
      status: 200,
      data: makeMe({ id: 'acct_brand_stale' }),
    })
    queryClient.getQueryState.mockReturnValue({
      dataUpdatedAt: 1_778_627_900_000,
    })
    getServerMeMock.mockResolvedValue({ ok: true, body: me })

    await expect(enforceBrand(queryClient)).resolves.toBeUndefined()

    expect(getServerMeMock).toHaveBeenCalledTimes(1)
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      ['/v1/me'],
      { data: me, status: 200 },
      { updatedAt: 1_778_628_000_000 },
    )
  })

  it('redirects to / when me kind does not match the onboarding kind', async () => {
    const queryClient = makeQueryClient()
    getServerMeMock.mockResolvedValue({
      ok: true,
      body: makeMe({ kind: 'creator' }),
    })

    await expect(enforceBrand(queryClient)).rejects.toEqual(
      redirect({ to: '/' }),
    )
  })

  it('tracks and redirects to fallbackPath when onboarding is not pending', async () => {
    const queryClient = makeQueryClient()
    getServerMeMock.mockResolvedValue({
      ok: true,
      body: makeMe({ onboarding_status: 'onboarded' }),
    })

    await expect(enforceBrand(queryClient)).rejects.toEqual(
      redirect({ to: '/campaigns' }),
    )
    expect(trackMock).toHaveBeenCalledWith('onboarding_redirect_enforced', {
      from: '/onboarding/brand',
      to: '/campaigns',
    })
  })

  it('tracks and redirects to redirect_to when onboarding is not pending', async () => {
    const queryClient = makeQueryClient()
    getServerMeMock.mockResolvedValue({
      ok: true,
      body: makeMe({
        onboarding_status: 'onboarded',
        redirect_to: '/workspace',
      }),
    })

    await expect(enforceBrand(queryClient)).rejects.toEqual(
      redirect({ to: '/workspace' }),
    )
    expect(trackMock).toHaveBeenCalledWith('onboarding_redirect_enforced', {
      from: '/onboarding/brand',
      to: '/workspace',
    })
  })

  it('redirects to /auth when me is unavailable', async () => {
    const queryClient = makeQueryClient()
    getServerMeMock.mockResolvedValue({ ok: false, body: null })

    await expect(enforceBrand(queryClient)).rejects.toEqual(
      redirect({ to: '/auth' }),
    )
  })
})
