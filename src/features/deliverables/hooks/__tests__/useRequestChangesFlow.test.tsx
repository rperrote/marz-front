import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { useRequestChangesFlow } from '../useRequestChangesFlow'
import { ApiError } from '#/shared/api/mutator'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockMutate = vi.fn()

vi.mock('#/features/deliverables/api/requestChanges', () => ({
  useRequestChangesMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useRequestChangesFlow', () => {
  beforeEach(() => {
    mockMutate.mockClear()
    let callCount = 0
    vi.stubGlobal('crypto', {
      randomUUID: () => `test-uuid-${++callCount}`,
    })
  })

  it('generates a unique idempotency key per mount', async () => {
    const { result: r1 } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )
    const { result: r2 } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      r1.current.toggleCategory('pacing')
    })
    act(() => {
      r1.current.submit()
    })
    expect(mockMutate).toHaveBeenCalledTimes(1)
    const key1 = mockMutate.mock.calls[0]![0].idempotencyKey

    act(() => {
      r2.current.toggleCategory('audio')
    })
    act(() => {
      r2.current.submit()
    })
    expect(mockMutate).toHaveBeenCalledTimes(2)
    const key2 = mockMutate.mock.calls[1]![0].idempotencyKey

    expect(key1).not.toBe(key2)
  })

  it('generates a fresh idempotency key after reset', () => {
    const keys: string[] = []
    vi.stubGlobal('crypto', {
      randomUUID: () => {
        const key = `uuid-${keys.length + 1}`
        keys.push(key)
        return key
      },
    })

    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('product_placement')
    })
    act(() => {
      result.current.submit()
    })
    const key1 = mockMutate.mock.calls[0]![0].idempotencyKey

    act(() => {
      result.current.reset()
    })
    act(() => {
      result.current.toggleCategory('audio')
    })
    act(() => {
      result.current.submit()
    })
    const key2 = mockMutate.mock.calls[1]![0].idempotencyKey

    expect(key1).not.toBe(key2)
  })

  it('disables submit when no category is selected', () => {
    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    expect(result.current.canSubmit).toBe(false)
    act(() => {
      result.current.submit()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('enables submit with any non-other category and empty notes', () => {
    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('pacing')
    })

    expect(result.current.canSubmit).toBe(true)
  })

  it('disables submit when Other is selected and notes are empty', () => {
    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('other')
    })

    expect(result.current.canSubmit).toBe(false)
  })

  it('enables submit when Other is selected with non-empty notes', () => {
    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('other')
      result.current.setNotes('Need to fix the intro')
    })

    expect(result.current.canSubmit).toBe(true)
  })

  it('disables submit when notes exceed 4000 characters', () => {
    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('audio')
      result.current.setNotes('a'.repeat(4001))
    })

    expect(result.current.canSubmit).toBe(false)
  })

  it('toggles category selection off when clicked again', () => {
    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('pacing')
    })
    expect(result.current.categories.has('pacing')).toBe(true)

    act(() => {
      result.current.toggleCategory('pacing')
    })
    expect(result.current.categories.has('pacing')).toBe(false)
  })

  it('submits with deterministically sorted categories', () => {
    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('pacing')
    })
    act(() => {
      result.current.toggleCategory('audio')
    })
    act(() => {
      result.current.toggleCategory('product_placement')
    })
    act(() => {
      result.current.submit()
    })

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const body = mockMutate.mock.calls[0]![0].body
    expect(body.categories).toEqual(['audio', 'pacing', 'product_placement'])
  })

  it('maps 422 validation_error to field error', async () => {
    mockMutate.mockImplementation((_vars, options) => {
      options.onError(
        new ApiError(422, 'validation_error', 'Invalid input', {
          field_errors: { notes: ['Notes are too short'] },
        }),
      )
    })

    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('other')
    })
    act(() => {
      result.current.setNotes('ok')
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(result.current.error).toEqual({
        kind: 'field',
        field: 'notes',
        message: 'Notes are too short',
      })
    })
  })

  it('maps 409 change_request_already_exists to toast + onConflict', async () => {
    mockMutate.mockImplementation((_vars, options) => {
      options.onError(
        new ApiError(409, 'change_request_already_exists', 'Already requested'),
      )
    })

    const onConflict = vi.fn()
    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1', { onConflict }),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('audio')
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(result.current.submitStatus).toBe('idle')
      expect(onConflict).toHaveBeenCalled()
    })
  })

  it('maps 403 forbidden_role to fatal error', async () => {
    mockMutate.mockImplementation((_vars, options) => {
      options.onError(new ApiError(403, 'forbidden_role', 'Not allowed'))
    })

    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('audio')
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(result.current.error).toEqual({
        kind: 'fatal',
        message: 'Not allowed',
      })
    })
  })

  it('maps unknown errors to fatal error', async () => {
    mockMutate.mockImplementation((_vars, options) => {
      options.onError(new Error('Network failure'))
    })

    const { result } = renderHook(
      () => useRequestChangesFlow('del-1', 'draft-1'),
      { wrapper: createWrapper() },
    )

    act(() => {
      result.current.toggleCategory('audio')
    })
    act(() => {
      result.current.submit()
    })

    await waitFor(() => {
      expect(result.current.error).toEqual({
        kind: 'fatal',
        message: 'Network failure',
      })
    })
  })
})
