import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { redirect } from '@tanstack/react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { workspaceSearchSchema } from '#/features/chat/workspace/workspaceSearchSchema'

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

async function callBeforeLoad(
  pathname = '/workspace',
  queryClient = makeQueryClient(),
) {
  const { Route } = await import('./workspace')
  const beforeLoad = (
    Route.options as unknown as {
      beforeLoad: (opts: {
        context: { queryClient: ReturnType<typeof makeQueryClient> }
        location: { pathname: string }
      }) => Promise<{ accountId: string; sessionKind: 'brand' | 'creator' }>
    }
  ).beforeLoad
  return beforeLoad({ context: { queryClient }, location: { pathname } })
}

describe('/workspace route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerMeResult = { ok: false, body: null }
  })

  it('keeps workspace search validation attached to the common route', async () => {
    const { Route } = await import('./workspace')

    expect(Route.options.validateSearch).toBe(workspaceSearchSchema)
  })

  it('redirects to /auth when not authenticated', async () => {
    mockServerMeResult = { ok: false, body: null }

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

  it('redirects to /auth when kind is missing', async () => {
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_pending_kind',
        kind: null,
        onboarding_status: 'kind_pending',
        redirect_to: '/auth/kind',
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

    await expect(callBeforeLoad('/workspace', queryClient)).resolves.toEqual({
      accountId: 'acct_creator_cached',
      sessionKind: 'creator',
    })
  })

  it('seeds queryClient after fetching from server', async () => {
    const queryClient = makeQueryClient()
    mockServerMeResult = {
      ok: true,
      body: {
        id: 'acct_brand_seed',
        kind: 'brand',
        onboarding_status: 'onboarded',
        redirect_to: null,
      },
    }

    await callBeforeLoad('/workspace', queryClient)

    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      ['/v1/me'],
      expect.objectContaining({ status: 200 }),
      expect.any(Object),
    )
  })

  it('mounts the shared AppShell directly and keeps chat layout as route content', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/routes/workspace.tsx'),
      'utf8',
    )
    const workspaceRouteFiles = [
      'src/routes/workspace.tsx',
      'src/routes/workspace.index.tsx',
      'src/routes/workspace.conversations.$conversationId.tsx',
    ]

    expect(source).toContain(
      "import { AppShell } from '#/features/identity/app-shell/AppShell'",
    )
    expect(source.match(/<AppShell/g)).toHaveLength(1)
    expect(source).toContain('accountKind={sessionKind}')
    expect(source).toContain('<WorkspaceLayout')
    expect(source).toContain('<ConversationRail')

    for (const file of workspaceRouteFiles) {
      const routeSource = readFileSync(resolve(process.cwd(), file), 'utf8')

      expect(routeSource).not.toContain('BrandShell')
      expect(routeSource).not.toContain('CreatorShell')
    }
  })
})
