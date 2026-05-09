import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from '@tanstack/react-router'

let mockServerMeResult: { ok: boolean; body: Record<string, unknown> | null } =
  { ok: false, body: null }

vi.mock('#/shared/auth/getServerMe', () => ({
  getServerMe: () => Promise.resolve(mockServerMeResult),
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
      }) => Promise<{ accountId: string }>
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
        id: 'acct_creator_pending',
        kind: 'creator',
        onboarding_status: 'onboarding_pending',
        redirect_to: '/onboarding/creator',
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/onboarding/creator' }),
    )
  })

  it('redirects to /onboarding/creator when onboarding incomplete and no redirect_to', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_creator_pending',
        kind: 'creator',
        onboarding_status: 'kind_pending',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/onboarding/creator' }),
    )
  })

  it('redirects to /workspace when kind is brand', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_1',
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/workspace' }),
    )
  })

  it('redirects to /auth when kind is null', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_pending_kind',
        kind: null,
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('redirects to /auth when kind is invalid', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_invalid_kind',
        kind: 'admin',
        onboarding_status: 'onboarding_pending',
        redirect_to: '/onboarding/creator',
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('returns AppShell context when kind is creator and onboarded', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_creator_1',
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }
    await expect(callBeforeLoad('/_creator/offers')).resolves.toEqual({
      accountId: 'acct_creator_1',
    })
  })

  it('uses cached queryClient data when fresh', async () => {
    const qc = makeQueryClient()
    qc.getQueryData.mockReturnValue({
      status: 200,
      data: {
        id: 'acct_creator_cached',
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    })
    qc.getQueryState.mockReturnValue({ dataUpdatedAt: Date.now() })

    await expect(callBeforeLoad('/_creator/offers', qc)).resolves.toEqual({
      accountId: 'acct_creator_cached',
    })
  })

  it('seeds queryClient after fetching from server', async () => {
    const qc = makeQueryClient()
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_creator_seed',
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
