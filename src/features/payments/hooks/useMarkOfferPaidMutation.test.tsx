import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { customFetch } from '#/shared/api/mutator'
import { generateIdempotencyKey } from '#/shared/api/idempotency'

import { useMarkOfferPaidMutation } from './useMarkOfferPaidMutation'

vi.mock('#/shared/api/mutator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#/shared/api/mutator')>()
  return {
    ...actual,
    customFetch: vi.fn(),
  }
})

vi.mock('#/shared/api/idempotency', () => ({
  generateIdempotencyKey: vi.fn(),
}))

const mockCustomFetch = vi.mocked(customFetch)
const mockGenerateIdempotencyKey = vi.mocked(generateIdempotencyKey)

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useMarkOfferPaidMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateIdempotencyKey.mockReturnValue(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    )
    mockCustomFetch.mockResolvedValue({
      status: 201,
      data: {},
      headers: new Headers(),
    })
  })

  it('submits amount with Idempotency-Key and invalidates offer, deliverable, and payment listings', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useMarkOfferPaidMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      offerId: 'offer-1',
      conversationId: 'conv-1',
      amount: '1250.50',
    })

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalledWith(
        '/v1/offers/offer-1/mark-as-paid',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          },
          body: JSON.stringify({ amount: '1250.50' }),
        },
      )
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['offers', 'current', 'conv-1'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['offers', 'list', 'conv-1'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['offers', 'detail', 'offer-1'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conversation-deliverables', 'conv-1'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['brand-payments-spending'],
      })
    })
  })
})
