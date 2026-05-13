import { redirect } from '@tanstack/react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockServerMeResult: { ok: boolean; body: Record<string, unknown> | null } =
  { ok: false, body: null }

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

vi.mock('#/shared/analytics/track', () => ({
  track: vi.fn(),
}))

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

async function callBeforeLoad(queryClient = makeQueryClient()) {
  const { Route } = await import('./inbox')
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: (opts: {
        context: { queryClient: ReturnType<typeof makeQueryClient> }
        location: { pathname: string }
      }) => Promise<{ accountId: string; sessionKind: 'brand' | 'creator' }>
    }
  ).beforeLoad
  return beforeLoad({
    context: { queryClient },
    location: { pathname: '/inbox' },
  })
}

describe('/inbox route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerMeResult = { ok: false, body: null }
  })

  it('validates search with inboxSearchSchema', async () => {
    const { Route } = await import('./inbox')
    const validateSearch = (
      Route.options as unknown as {
        validateSearch: (search: Record<string, unknown>) => unknown
      }
    ).validateSearch

    expect(validateSearch({ campaign_id: 'not-a-uuid' })).toEqual({
      campaign_id: undefined,
    })
    expect(
      validateSearch({
        campaign_id: '00000000-0000-0000-0000-000000000000',
      }),
    ).toEqual({ campaign_id: '00000000-0000-0000-0000-000000000000' })
  })

  it('redirects to /auth when not authenticated', async () => {
    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('redirects to redirect_to when onboarding is incomplete', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_pending',
        kind: 'brand',
        onboarding_status: 'onboarding_pending',
        redirect_to: '/onboarding/brand',
      },
    }

    await expect(callBeforeLoad()).rejects.toEqual(
      redirect({ to: '/onboarding/brand' }),
    )
  })

  it('redirects to /auth when kind is invalid', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_invalid_kind',
        kind: 'admin',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }

    await expect(callBeforeLoad()).rejects.toEqual(redirect({ to: '/auth' }))
  })

  it('returns brand AppShell context for an onboarded brand session', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_1',
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }

    await expect(callBeforeLoad()).resolves.toEqual({
      accountId: 'acct_brand_1',
      sessionKind: 'brand',
    })
  })

  it('returns creator AppShell context for an onboarded creator session', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_creator_1',
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }

    await expect(callBeforeLoad()).resolves.toEqual({
      accountId: 'acct_creator_1',
      sessionKind: 'creator',
    })
  })

  it('uses cached queryClient data when fresh', async () => {
    const queryClient = makeQueryClient()
    queryClient.getQueryData.mockReturnValue({
      status: 200,
      data: {
        id: 'acct_creator_cached',
        kind: 'creator',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    })
    queryClient.getQueryState.mockReturnValue({ dataUpdatedAt: Date.now() })

    await expect(callBeforeLoad(queryClient)).resolves.toEqual({
      accountId: 'acct_creator_cached',
      sessionKind: 'creator',
    })
  })
})
