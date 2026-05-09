import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { ApiError } from '#/shared/api/mutator'

import {
  handleDiscoveryMutationError,
  useAcceptApplication,
  useCreateCampaignInvite,
  useContactMatch,
  useIdempotencyKey,
  useRejectApplication,
} from './mutations'
import {
  acceptCampaignDiscoveryApplication,
  contactCampaignDiscoveryMatch,
  createCampaignDiscoveryInvite,
  rejectCampaignDiscoveryApplication,
} from '#/shared/api/generated/campaigns/campaigns'
import {
  trackDiscoveryApplicationDecided,
  trackDiscoveryInviteCreated,
  trackDiscoveryMatchContacted,
} from '#/shared/analytics/discoveryTracking'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('#/shared/api/generated/campaigns/campaigns', () => ({
  acceptCampaignDiscoveryApplication: vi.fn(),
  contactCampaignDiscoveryMatch: vi.fn(),
  createCampaignDiscoveryInvite: vi.fn(),
  getListCampaignParticipantsQueryKey: vi.fn((campaignId: string) => [
    'campaign',
    campaignId,
    'participants',
  ]),
  rejectCampaignDiscoveryApplication: vi.fn(),
}))

vi.mock('#/shared/analytics/discoveryTracking', () => ({
  trackDiscoveryApplicationDecided: vi.fn(),
  trackDiscoveryInviteCreated: vi.fn(),
  trackDiscoveryMatchContacted: vi.fn(),
}))

const mockAcceptCampaignDiscoveryApplication = vi.mocked(
  acceptCampaignDiscoveryApplication,
)
const mockContactCampaignDiscoveryMatch = vi.mocked(
  contactCampaignDiscoveryMatch,
)
const mockCreateCampaignDiscoveryInvite = vi.mocked(
  createCampaignDiscoveryInvite,
)
const mockRejectCampaignDiscoveryApplication = vi.mocked(
  rejectCampaignDiscoveryApplication,
)
const mockTrackDiscoveryApplicationDecided = vi.mocked(
  trackDiscoveryApplicationDecided,
)
const mockTrackDiscoveryInviteCreated = vi.mocked(trackDiscoveryInviteCreated)
const mockTrackDiscoveryMatchContacted = vi.mocked(trackDiscoveryMatchContacted)

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('discovery campaign detail mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    let keyIndex = 0
    vi.stubGlobal('crypto', {
      randomUUID: () => `idempotency-key-${++keyIndex}`,
    })
  })

  it('useContactMatch navigates to the existing conversation on 409 conversation_already_exists', async () => {
    const onConversationReady = vi.fn()
    mockContactCampaignDiscoveryMatch.mockRejectedValueOnce(
      new ApiError(
        409,
        'conversation_already_exists',
        'Conversation already exists',
        {
          conversation_id: 'conv-existing',
        } as unknown as { field_errors?: Record<string, string[]> },
      ),
    )

    const { result } = renderHook(
      () =>
        useContactMatch('campaign-1', {
          onConversationReady,
        }),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.mutate({
        matchId: 'match-1',
        data: { invite: { mode: 'email', email: 'creator@example.com' } },
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(onConversationReady).toHaveBeenCalledWith('conv-existing')
  })

  it('useAcceptApplication navigates to the new conversation on success', async () => {
    const onConversationReady = vi.fn()
    mockAcceptCampaignDiscoveryApplication.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      data: {
        application_id: 'application-1',
        status: 'accepted',
        decided_at: '2026-05-08T00:00:00Z',
        conversation: { id: 'conv-new' },
      },
    })

    const { result } = renderHook(
      () =>
        useAcceptApplication('campaign-1', {
          onConversationReady,
        }),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.mutate({ applicationId: 'application-1' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(onConversationReady).toHaveBeenCalledWith('conv-new')
  })

  it('tracks a contacted match once on success', async () => {
    mockContactCampaignDiscoveryMatch.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      data: {
        match_id: 'match-1',
        status: 'contacted',
        contacted_at: '2026-05-08T00:00:00Z',
        invite: null,
      },
    })

    const { result } = renderHook(() => useContactMatch('campaign-1'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        matchId: 'match-1',
        data: {
          invite: {
            mode: 'in_platform',
            creator_account_id: 'creator-1',
          },
        },
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockTrackDiscoveryMatchContacted).toHaveBeenCalledTimes(1)
    expect(mockTrackDiscoveryMatchContacted).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      mode: 'in_platform',
    })
  })

  it('tracks application decisions on success', async () => {
    mockRejectCampaignDiscoveryApplication.mockResolvedValueOnce({
      status: 200,
      headers: new Headers(),
      data: {
        application_id: 'application-1',
        status: 'rejected',
        decided_at: '2026-05-08T00:00:00Z',
        conversation: null,
      },
    })

    const { result } = renderHook(() => useRejectApplication('campaign-1'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({ applicationId: 'application-1' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockTrackDiscoveryApplicationDecided).toHaveBeenCalledTimes(1)
    expect(mockTrackDiscoveryApplicationDecided).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      decision: 'reject',
    })
  })

  it('tracks created invites on success', async () => {
    mockCreateCampaignDiscoveryInvite.mockResolvedValueOnce({
      status: 201,
      headers: new Headers(),
      data: {
        invite_id: 'invite-1',
        mode: 'email',
        status: 'sent',
        expires_at: '2026-06-08T00:00:00Z',
      },
    })

    const { result } = renderHook(() => useCreateCampaignInvite('campaign-1'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        mode: 'email',
        email: 'creator@example.com',
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(mockTrackDiscoveryInviteCreated).toHaveBeenCalledTimes(1)
    expect(mockTrackDiscoveryInviteCreated).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      mode: 'email',
    })
  })

  it('useIdempotencyKey reuses the key for the same payload and generates a new one for a different payload', () => {
    const { result } = renderHook(() =>
      useIdempotencyKey((payload: { message: string }) =>
        JSON.stringify(payload),
      ),
    )

    const first = result.current.get({ message: 'Hola' })
    const retry = result.current.get({ message: 'Hola' })
    const changed = result.current.get({ message: 'Chau' })

    expect(retry).toBe(first)
    expect(changed).not.toBe(first)
  })

  it.each([
    [
      'plan_does_not_allow_in_platform_invite',
      'error',
      'Tu plan no permite invitaciones in-platform. Usá email o actualizá el plan.',
    ],
    [
      'conversation_already_exists',
      'info',
      'Ya existe una conversación con este creator.',
    ],
    ['invite_duplicate', 'info', 'La invitación ya fue enviada.'],
    [
      'campaign_not_discoverable',
      'error',
      'Esta campaña no está disponible para Discovery.',
    ],
    [
      'application_not_actionable',
      'error',
      'Esta aplicación ya no se puede modificar.',
    ],
    ['match_not_actionable', 'error', 'Este match ya no se puede contactar.'],
  ] as const)(
    'handleDiscoveryMutationError shows the expected toast for 409 %s',
    (code, toastKind, message) => {
      handleDiscoveryMutationError(new ApiError(409, code, 'Conflict'))

      expect(toast[toastKind]).toHaveBeenCalledWith(message)
    },
  )
})
