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
  pathname = '/_brand/campaigns',
  queryClient = makeQueryClient(),
) {
  const { Route } = await import('./_brand')
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: (opts: {
        context: { queryClient: ReturnType<typeof makeQueryClient> }
        location: { pathname: string }
      }) => Promise<{ accountId: string; hasBrandWorkspace: boolean }>
    }
  ).beforeLoad
  return beforeLoad({ context: { queryClient }, location: { pathname } })
}

describe('/_brand beforeLoad', () => {
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
        id: 'acct_brand_pending',
        kind: 'brand',
        onboarding_status: 'onboarding_pending',
        redirect_to: '/onboarding/brand',
        brand_workspace: { id: 'ws_1' },
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/onboarding/brand' }),
    )
  })

  it('redirects to /onboarding/brand when onboarding incomplete and no redirect_to', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_pending',
        kind: 'brand',
        onboarding_status: 'kind_pending',
        redirect_to: null,
        brand_workspace: { id: 'ws_1' },
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/onboarding/brand' }),
    )
  })

  it('redirects to /workspace when kind is creator', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_creator_1',
        kind: 'creator',
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
        redirect_to: '/onboarding/brand',
      },
    }
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('returns AppShell context when kind is brand, onboarded, and has workspace', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_1',
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
        brand_workspace: { id: 'ws_1' },
      },
    }
    await expect(callBeforeLoad('/_brand/campaigns')).resolves.toEqual({
      accountId: 'acct_brand_1',
      hasBrandWorkspace: true,
    })
  })

  it('returns MissingWorkspace fallback context when brand is onboarded without workspace', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_1',
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
        brand_workspace: null,
      },
    }
    await expect(callBeforeLoad('/_brand/campaigns')).resolves.toEqual({
      accountId: 'acct_brand_1',
      hasBrandWorkspace: false,
    })
  })

  it('uses cached queryClient data when fresh', async () => {
    const qc = makeQueryClient()
    qc.getQueryData.mockReturnValue({
      status: 200,
      data: {
        id: 'acct_brand_cached',
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
        brand_workspace: { id: 'ws_cached' },
      },
    })
    qc.getQueryState.mockReturnValue({ dataUpdatedAt: Date.now() })

    await expect(callBeforeLoad('/_brand/campaigns', qc)).resolves.toEqual({
      accountId: 'acct_brand_cached',
      hasBrandWorkspace: true,
    })
  })

  it('seeds queryClient after fetching from server', async () => {
    const qc = makeQueryClient()
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_seed',
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
        brand_workspace: { id: 'ws_seed' },
      },
    }
    await callBeforeLoad('/_brand/campaigns', qc)
    expect(qc.setQueryData).toHaveBeenCalledWith(
      ['/v1/me'],
      expect.objectContaining({ status: 200 }),
      expect.any(Object),
    )
  })
})
