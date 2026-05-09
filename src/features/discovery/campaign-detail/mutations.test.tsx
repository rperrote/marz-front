import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'

import { ApiError } from '#/shared/api/mutator'

import {
  handleDiscoveryMutationError,
  useAcceptApplication,
  useContactMatch,
  useIdempotencyKey,
} from './mutations'
import {
  acceptCampaignDiscoveryApplication,
  contactCampaignDiscoveryMatch,
} from '#/shared/api/generated/campaigns/campaigns'

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

const mockAcceptCampaignDiscoveryApplication = vi.mocked(
  acceptCampaignDiscoveryApplication,
)
const mockContactCampaignDiscoveryMatch = vi.mocked(
  contactCampaignDiscoveryMatch,
)

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
