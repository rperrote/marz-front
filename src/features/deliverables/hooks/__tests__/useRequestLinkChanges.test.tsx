import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type * as ApiMutator from '#/shared/api/mutator'

import { ApiError } from '#/shared/api/mutator'
import {
  useRequestLinkChanges,
  useRequestLinkChangesMutation,
} from '../useRequestLinkChanges'

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

describe('useRequestLinkChanges', () => {
  beforeEach(() => {
    mockCustomFetch.mockReset()
    mockToastError.mockClear()
    vi.stubGlobal('crypto', {
      randomUUID: () => 'request-key',
    })
  })

  it('posts request changes and invalidates deliverable link queries', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    mockCustomFetch.mockResolvedValue({
      data: { change_request_id: 'cr-1', status: 'changes_requested' },
      status: 200,
    })
    const { result } = renderHook(() => useRequestLinkChangesMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        deliverableId: 'del-1',
        linkId: 'link-1',
        body: { categories: ['audio'], notes: 'Fix audio' },
        idempotencyKey: 'request-key',
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockCustomFetch).toHaveBeenCalledWith(
      '/v1/deliverables/del-1/links/link-1/request-changes',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Idempotency-Key': 'request-key' },
        body: JSON.stringify({ categories: ['audio'], notes: 'Fix audio' }),
      }),
    )
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['deliverable', 'del-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['deliverable', 'del-1', 'links'],
    })
  })

  it('requires notes when other is selected', () => {
    const queryClient = createQueryClient()
    const { result } = renderHook(
      () => useRequestLinkChanges('del-1', 'link-1'),
      { wrapper: createWrapper(queryClient) },
    )

    act(() => {
      result.current.toggleCategory('other')
    })

    expect(result.current.canSubmit).toBe(false)
    expect(mockCustomFetch).not.toHaveBeenCalled()
  })

  it('maps duplicate request conflicts to the required toast', async () => {
    mockCustomFetch.mockRejectedValue(
      new ApiError(409, 'CHANGE_REQUEST_ALREADY_EXISTS', 'Already requested'),
    )
    const queryClient = createQueryClient()
    const onConflict = vi.fn()
    const { result } = renderHook(
      () => useRequestLinkChanges('del-1', 'link-1', { onConflict }),
      { wrapper: createWrapper(queryClient) },
    )

    act(() => {
      result.current.toggleCategory('audio')
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Changes already requested on this link.',
      )
      expect(onConflict).toHaveBeenCalledTimes(1)
    })
  })
})
