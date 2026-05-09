import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { exportCreatorEarningsCSV } from '#/shared/api/generated/creator/creator'
import { useExportCreatorEarningsMutation } from '../useExportCreatorEarnings'

vi.mock('#/shared/api/generated/creator/creator', () => ({
  exportCreatorEarningsCSV: vi.fn(),
}))

const mockExportCreatorEarningsCSV = vi.mocked(exportCreatorEarningsCSV)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useExportCreatorEarningsMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a CSV blob and preserves X-Truncated as a boolean flag', async () => {
    mockExportCreatorEarningsCSV.mockResolvedValue({
      data: 'date,amount\n2026-05-01,10.00\n',
      status: 200,
      headers: new Headers({ 'X-Truncated': 'true' }),
    })

    const { result } = renderHook(() => useExportCreatorEarningsMutation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ period: '12m', q: 'brand' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockExportCreatorEarningsCSV).toHaveBeenCalledWith(
      { period: '12m', q: 'brand' },
      { headers: { Accept: 'text/csv' } },
    )
    expect(result.current.data?.truncated).toBe(true)
    expect(result.current.data?.blob).toBeInstanceOf(Blob)
    await expect(result.current.data?.blob.text()).resolves.toBe(
      'date,amount\n2026-05-01,10.00\n',
    )
  })
})
