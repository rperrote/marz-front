import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'

const mockGetCampaignBrief = vi.fn()

vi.mock('#/shared/api/generated/campaigns/campaigns', () => ({
  getCampaignBrief: (...args: unknown[]) => mockGetCampaignBrief(...args),
  getGetCampaignBriefQueryKey: (id: string) => ['campaign-brief', id],
}))

// eslint-disable-next-line import/first
import { useCampaignBrief } from './useCampaignBrief'

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useCampaignBrief', () => {
  beforeEach(() => {
    mockGetCampaignBrief.mockReset()
  })

  it('maps backend hard_filters {field, operator, value} into store HardFilter shape', async () => {
    mockGetCampaignBrief.mockResolvedValue({
      data: {
        campaign_id: 'c-1',
        scoring_dimensions: [],
        hard_filters: [
          { field: 'followers', operator: 'gte', value: '10000' },
          { field: 'language', operator: 'eq', value: 'es' },
        ],
        disqualifiers: [],
      },
    })

    const { result } = renderHook(() => useCampaignBrief('c-1'), { wrapper })
    await waitFor(() => {
      expect(result.current.data).toBeTruthy()
    })

    const filters = result.current.data!.draft.brief.hard_filters
    expect(filters).toHaveLength(2)
    expect(filters[0]).toMatchObject({
      field: 'followers',
      operator: 'gte',
      value: '10000',
    })
    expect(filters[0]!.id).toBeTruthy()
    expect(filters[1]).toMatchObject({
      field: 'language',
      operator: 'eq',
      value: 'es',
    })
  })

  it('hydrates tone, key_messages, do_list, dont_list from response', async () => {
    mockGetCampaignBrief.mockResolvedValue({
      data: {
        campaign_id: 'c-1',
        tone: 'formal',
        key_messages: ['k1'],
        do_list: ['d1'],
        dont_list: ['nd1'],
        scoring_dimensions: [],
        hard_filters: [],
        disqualifiers: [],
      },
    })

    const { result } = renderHook(() => useCampaignBrief('c-1'), { wrapper })
    await waitFor(() => {
      expect(result.current.data).toBeTruthy()
    })

    const brief = result.current.data!.draft.brief
    expect(brief.tone).toBe('formal')
    expect(brief.key_messages).toEqual(['k1'])
    expect(brief.do_list).toEqual(['d1'])
    expect(brief.dont_list).toEqual(['nd1'])
  })

  it('defaults missing tone/key_messages/do_list/dont_list to null/[]', async () => {
    mockGetCampaignBrief.mockResolvedValue({
      data: {
        campaign_id: 'c-1',
        scoring_dimensions: [],
        hard_filters: [],
        disqualifiers: [],
      },
    })

    const { result } = renderHook(() => useCampaignBrief('c-1'), { wrapper })
    await waitFor(() => {
      expect(result.current.data).toBeTruthy()
    })

    const brief = result.current.data!.draft.brief
    expect(brief.tone).toBeNull()
    expect(brief.key_messages).toEqual([])
    expect(brief.do_list).toEqual([])
    expect(brief.dont_list).toEqual([])
  })
})
