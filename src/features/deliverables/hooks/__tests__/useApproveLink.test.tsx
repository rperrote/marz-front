import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type * as ApiMutator from '#/shared/api/mutator'

import { ApiError } from '#/shared/api/mutator'
import {
  getApproveLinkErrorMessage,
  useApproveLink,
  useApproveLinkMutation,
} from '../useApproveLink'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const { mockCustomFetch, mockToastError } = vi.hoisted(() => ({
  mockCustomFetch: vi.fn(),
  mockToastError: vi.fn(),
}))

vi.mock('#/shared/api/mutator', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiMutator>()
  return {
    ...actual,
    customFetch: (...args: unknown[]) => mockCustomFetch(...args),
  }
})

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}))

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

describe('useApproveLinkMutation', () => {
  beforeEach(() => {
    mockCustomFetch.mockReset()
    mockToastError.mockClear()
    vi.stubGlobal('crypto', {
      randomUUID: () => 'attempt-key',
    })
  })

  it('optimistically completes the deliverable and invalidates link queries', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['deliverable', 'del-1'], {
      id: 'del-1',
      status: 'link_submitted',
    })
    mockCustomFetch.mockResolvedValue({ data: undefined, status: 200 })

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useApproveLinkMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        deliverableId: 'del-1',
        linkId: 'link-1',
        idempotencyKey: 'attempt-key',
      })
    })

    await waitFor(() => {
      expect(
        queryClient.getQueryData<{ status: string }>(['deliverable', 'del-1'])
          ?.status,
      ).toBe('completed')
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockCustomFetch).toHaveBeenCalledWith(
      '/v1/deliverables/del-1/links/link-1/approve',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Idempotency-Key': 'attempt-key' },
      }),
    )
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['deliverable', 'del-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['deliverable', 'del-1', 'links'],
    })
  })

  it('rolls back optimistic state on error', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['deliverable', 'del-1'], {
      id: 'del-1',
      status: 'link_submitted',
    })
    mockCustomFetch.mockRejectedValue(
      new ApiError(409, 'INVALID_LINK_STATUS', 'Invalid status'),
    )

    const { result } = renderHook(() => useApproveLinkMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        deliverableId: 'del-1',
        linkId: 'link-1',
        idempotencyKey: 'attempt-key',
      })
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(
      queryClient.getQueryData<{ status: string }>(['deliverable', 'del-1'])
        ?.status,
    ).toBe('link_submitted')
  })

  it('shows typed approve errors from the wrapping hook', async () => {
    mockCustomFetch.mockRejectedValue(
      new ApiError(403, 'FORBIDDEN', 'Forbidden'),
    )
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useApproveLink('del-1', 'link-1'), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Only brand owner can approve links.',
      )
    })
  })

  it('maps invalid link status to the required toast message', () => {
    expect(
      getApproveLinkErrorMessage(
        new ApiError(409, 'INVALID_LINK_STATUS', 'Invalid status'),
      ),
    ).toBe('Link is no longer pending review.')
  })
})
