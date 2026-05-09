import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { markInboxItemRead as generatedMarkInboxItemRead } from '#/shared/api/generated/notifications/notifications'
import { ApiError } from '#/shared/api/mutator'

import { useMarkInboxItemReadMutation } from './useMarkInboxItemReadMutation'

vi.mock('#/shared/api/generated/notifications/notifications', () => ({
  markInboxItemRead: vi.fn(),
}))

const itemId = '018f2f3a-1f2b-7c8d-9e0f-123456789abc'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useMarkInboxItemReadMutation', () => {
  beforeEach(() => {
    vi.mocked(generatedMarkInboxItemRead).mockReset()
  })

  it('sends an idempotency key and invalidates inbox queries on success', async () => {
    const queryClient = new QueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(generatedMarkInboxItemRead).mockResolvedValue({
      data: {
        item_id: itemId,
        status: 'read',
        read_at: '2026-05-09T00:00:00.000Z',
      },
      status: 200,
      headers: new Headers(),
    })

    const { result } = renderHook(() => useMarkInboxItemReadMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ item_id: itemId, read_reason: 'manual' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(generatedMarkInboxItemRead).toHaveBeenCalledWith(
      itemId,
      { read_reason: 'manual' },
      {
        headers: {
          'Idempotency-Key': expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
          ),
        },
      },
    )
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['inbox'] })
  })

  it('invalidates inbox queries on conflict so stale rows refetch', async () => {
    const queryClient = new QueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(generatedMarkInboxItemRead).mockRejectedValue(
      new ApiError(409, 'inbox_item_not_actionable', 'Not actionable'),
    )

    const { result } = renderHook(() => useMarkInboxItemReadMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ item_id: itemId, read_reason: 'manual' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['inbox'] })
  })
})
