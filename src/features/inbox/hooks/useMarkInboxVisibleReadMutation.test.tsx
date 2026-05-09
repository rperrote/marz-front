import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { markInboxRead as generatedMarkInboxVisibleRead } from '#/shared/api/generated/notifications/notifications'

import { useMarkInboxVisibleReadMutation } from './useMarkInboxVisibleReadMutation'

vi.mock('#/shared/api/generated/notifications/notifications', () => ({
  markInboxRead: vi.fn(),
}))

const campaignId = '018f2f3a-1f2b-7c8d-9e0f-123456789abc'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useMarkInboxVisibleReadMutation', () => {
  beforeEach(() => {
    vi.mocked(generatedMarkInboxVisibleRead).mockReset()
  })

  it('sends an idempotency key and invalidates inbox queries on success', async () => {
    const queryClient = new QueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(generatedMarkInboxVisibleRead).mockResolvedValue({
      data: {
        marked_count: 2,
        campaign_id: campaignId,
        sections: ['action'],
        read_at: '2026-05-09T00:00:00.000Z',
      },
      status: 200,
      headers: new Headers(),
    })

    const { result } = renderHook(() => useMarkInboxVisibleReadMutation(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ campaign_id: campaignId, sections: ['action'] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(generatedMarkInboxVisibleRead).toHaveBeenCalledWith(
      { campaign_id: campaignId, sections: ['action'] },
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
})
