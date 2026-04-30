import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { toast } from 'sonner'

import { useOfferActions } from './useOfferActions'
import { ApiError } from '#/shared/api/mutator'
import { trackOfferEvent } from '../analytics'

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
    success: vi.fn(),
  },
}))

vi.mock('../analytics', () => ({
  trackOfferEvent: vi.fn(),
}))

const mockTrackOfferEvent = vi.mocked(trackOfferEvent)

let mockFetchResponse: unknown = {
  data: { id: 'offer-1', status: 'accepted' },
  status: 200,
}
let mockFetchError: Error | null = null

vi.mock('#/shared/api/mutator', async () => {
  const actual = await vi.importActual('#/shared/api/mutator')
  return {
    ...actual,
    customFetch: vi.fn(async () => {
      if (mockFetchError) throw mockFetchError
      return mockFetchResponse
    }),
  }
})

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient()
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client }, children)
  }
}

describe('useOfferActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchError = null
    mockFetchResponse = {
      data: { id: 'offer-1', status: 'accepted' },
      status: 200,
    }
  })

  it('accept mutation succeeds and fires offer_accepted analytics', async () => {
    const { result } = renderHook(
      () => useOfferActions({ conversationId: 'conv-1' }),
      { wrapper: createWrapper() },
    )

    result.current.accept.mutate({
      offerId: 'offer-1',
      sentAt: new Date().toISOString(),
      offerType: 'single',
    })

    await waitFor(() => {
      expect(result.current.accept.isSuccess).toBe(true)
    })

    expect(mockTrackOfferEvent).toHaveBeenCalledWith(
      'offer_accepted',
      expect.objectContaining({
        actor_kind: 'creator',
        time_to_response_seconds: expect.any(Number),
      }),
    )
  })

  it('accept mutation handles 409 with toast', async () => {
    mockFetchError = new ApiError(
      409,
      'offer_not_actionable',
      'Offer expired',
      {},
    )

    const { result } = renderHook(
      () => useOfferActions({ conversationId: 'conv-1' }),
      { wrapper: createWrapper() },
    )

    result.current.accept.mutate({
      offerId: 'offer-1',
      sentAt: new Date().toISOString(),
      offerType: 'single',
    })

    await waitFor(() => {
      expect(result.current.accept.isError).toBe(true)
    })
    expect(toast.error).toHaveBeenCalledWith('Offer expired')
  })

  it('reject mutation succeeds and fires offer_rejected analytics', async () => {
    mockFetchResponse = {
      data: { id: 'offer-1', status: 'rejected' },
      status: 200,
    }

    const { result } = renderHook(
      () => useOfferActions({ conversationId: 'conv-1' }),
      { wrapper: createWrapper() },
    )

    result.current.reject.mutate({
      offerId: 'offer-1',
      sentAt: new Date().toISOString(),
      offerType: 'single',
      reason: 'Not interested',
    })

    await waitFor(() => {
      expect(result.current.reject.isSuccess).toBe(true)
    })

    expect(mockTrackOfferEvent).toHaveBeenCalledWith(
      'offer_rejected',
      expect.objectContaining({
        actor_kind: 'creator',
        time_to_response_seconds: expect.any(Number),
      }),
    )
  })

  it('reject mutation handles 409 with toast', async () => {
    mockFetchError = new ApiError(
      409,
      'offer_not_actionable',
      'Offer expired',
      {},
    )

    const { result } = renderHook(
      () => useOfferActions({ conversationId: 'conv-1' }),
      { wrapper: createWrapper() },
    )

    result.current.reject.mutate({
      offerId: 'offer-1',
      sentAt: new Date().toISOString(),
      offerType: 'single',
    })

    await waitFor(() => {
      expect(result.current.reject.isError).toBe(true)
    })
    expect(toast.error).toHaveBeenCalledWith('Offer is no longer actionable')
  })

  it('isActing reflects pending state', () => {
    const { result } = renderHook(
      () => useOfferActions({ conversationId: 'conv-1' }),
      { wrapper: createWrapper() },
    )
    expect(result.current.isActing).toBe(false)
  })

  it('optimistic accept rolls back on 409', async () => {
    const queryClient = createTestQueryClient()
    const initialOffers = [
      { id: 'offer-1', status: 'sent', total_amount: 1000 },
      { id: 'offer-2', status: 'sent', total_amount: 2000 },
    ]
    const queryKey = ['conversations', 'conv-1', 'offers']
    queryClient.setQueryData(queryKey, initialOffers)

    mockFetchError = new ApiError(
      409,
      'offer_not_actionable',
      'Offer expired',
      {},
    )

    const { result } = renderHook(
      () => useOfferActions({ conversationId: 'conv-1' }),
      { wrapper: createWrapper(queryClient) },
    )

    result.current.accept.mutate({
      offerId: 'offer-1',
      sentAt: new Date().toISOString(),
      offerType: 'single',
    })

    await waitFor(() => {
      expect(result.current.accept.isError).toBe(true)
    })

    const restored = queryClient.getQueryData(queryKey)
    expect(restored).toEqual(initialOffers)
  })
})
