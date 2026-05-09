import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getBrandPaymentsSpending } from '../api/getBrandPaymentsSpending'
import {
  getBrandPaymentsSpendingQueryKey,
  useBrandPaymentsSpendingQuery,
} from './useBrandPaymentsSpendingQuery'

vi.mock('../api/getBrandPaymentsSpending', () => ({
  getBrandPaymentsSpending: vi.fn(),
}))

vi.mock('#/features/identity/session/BrandSessionContext', () => ({
  useBrandSession: () => ({
    account: { id: 'acct-1' },
    brandWorkspace: { id: 'workspace-1', name: 'Workspace' },
  }),
}))

const mockGetBrandPaymentsSpending = vi.mocked(getBrandPaymentsSpending)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useBrandPaymentsSpendingQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBrandPaymentsSpending.mockResolvedValue({
      kpis: [],
      rows: [],
      next_cursor: null,
    })
  })

  it('builds a stable query key without undefined filters', () => {
    expect(
      getBrandPaymentsSpendingQueryKey('workspace-1', {
        filters: {
          period: '30d',
          campaignId: undefined,
          creatorId: 'creator-1',
          q: '',
        },
      }),
    ).toEqual([
      'brand-payments-spending',
      'workspace-1',
      { period: '30d', creatorId: 'creator-1' },
    ])
  })

  it('changes the query key when filters change', () => {
    const baseKey = getBrandPaymentsSpendingQueryKey('workspace-1', {
      filters: { period: '30d', q: 'ana' },
    })
    const changedKey = getBrandPaymentsSpendingQueryKey('workspace-1', {
      filters: { period: '90d', q: 'ana' },
    })

    expect(changedKey).not.toEqual(baseKey)
  })

  it('passes cursor to the server function for keyset pagination', async () => {
    renderHook(
      () =>
        useBrandPaymentsSpendingQuery({
          filters: { period: '30d', campaignId: 'campaign-1' },
          cursor: 'cursor-2',
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(mockGetBrandPaymentsSpending).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            period: '30d',
            campaignId: 'campaign-1',
            workspaceId: 'workspace-1',
            cursor: 'cursor-2',
          },
        }),
      )
    })
  })
})
