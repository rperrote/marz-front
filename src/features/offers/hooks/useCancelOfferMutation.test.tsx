import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { customFetch } from '#/shared/api/mutator'
import { generateIdempotencyKey } from '#/shared/api/idempotency'

import { useCancelOfferMutation } from './useCancelOfferMutation'

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

describe('useCancelOfferMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateIdempotencyKey.mockReturnValue(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    )
    mockCustomFetch.mockResolvedValue({
      status: 204,
      data: undefined,
      headers: new Headers(),
    })
  })

  it('injects Idempotency-Key and invalidates current, list, and detail offer queries', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCancelOfferMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      offerId: 'offer-1',
      conversationId: 'conv-1',
    })

    await waitFor(() => {
      expect(mockCustomFetch).toHaveBeenCalledWith('/v1/offers/offer-1/cancel', {
        method: 'POST',
        headers: {
          'Idempotency-Key': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        },
      })
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
    })
  })
})
