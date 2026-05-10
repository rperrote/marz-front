import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import type { BriefDraft } from '../store'

const mockCreateCampaign = vi.fn()

vi.mock('#/shared/api/generated/campaigns/campaigns', () => ({
  createCampaign: (...args: unknown[]) => mockCreateCampaign(...args),
}))

// eslint-disable-next-line import/first
import { useCreateCampaign } from './useCreateCampaign'

function makeDraft(): BriefDraft {
  return {
    campaign: {
      name: 'Mi campaña',
      objective: 'brand_awareness',
      budget_amount: 5000,
      budget_currency: 'USD',
      deadline: '2026-06-01',
    },
    brief: {
      tone: 'casual',
      key_messages: ['msg1'],
      do_list: ['do1'],
      dont_list: ['dont1'],
      icp_description: 'fitness creators',
      icp_age_min: 18,
      icp_age_max: 35,
      icp_genders: ['male'],
      icp_countries: ['AR'],
      icp_platforms: ['instagram'],
      icp_interests: ['fitness'],
      scoring_dimensions: [
        {
          id: 'dim-1',
          name: 'Engagement',
          description: 'rate alto',
          weight_pct: 100,
          positive_signals: ['signal'],
          negative_signals: [],
        },
      ],
      hard_filters: [
        { id: 'hf-1', field: 'followers', operator: 'gte', value: '10000' },
      ],
      disqualifiers: ['gambling'],
    },
  }
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return createElement(QueryClientProvider, { client }, children)
}

describe('useCreateCampaign', () => {
  beforeEach(() => {
    mockCreateCampaign.mockReset()
    mockCreateCampaign.mockResolvedValue({ data: { campaign_id: 'c-1' } })
  })

  it('maps hard_filters using {field, operator, value}', async () => {
    const { result } = renderHook(() => useCreateCampaign(), { wrapper })
    result.current.mutate({
      idempotencyKey: 'idem-1',
      draft: makeDraft(),
      source: {
        websiteUrl: 'https://brand.example',
        descriptionText: '',
        pdfS3Key: null,
      },
    })
    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalled()
    })
    const body = mockCreateCampaign.mock.calls[0]![0]
    expect(body.brief.hard_filters).toEqual([
      { field: 'followers', operator: 'gte', value: '10000' },
    ])
  })

  it('forwards tone, key_messages, do_list, dont_list to the POST body', async () => {
    const { result } = renderHook(() => useCreateCampaign(), { wrapper })
    result.current.mutate({
      idempotencyKey: 'idem-2',
      draft: makeDraft(),
      source: {
        websiteUrl: 'https://brand.example',
        descriptionText: '',
        pdfS3Key: null,
      },
    })
    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalled()
    })
    const body = mockCreateCampaign.mock.calls[0]![0]
    expect(body.brief.tone).toBe('casual')
    expect(body.brief.key_messages).toEqual(['msg1'])
    expect(body.brief.do_list).toEqual(['do1'])
    expect(body.brief.dont_list).toEqual(['dont1'])
  })

  it('drops scoring extras (description, signals) the backend does not accept', async () => {
    const { result } = renderHook(() => useCreateCampaign(), { wrapper })
    result.current.mutate({
      idempotencyKey: 'idem-3',
      draft: makeDraft(),
      source: {
        websiteUrl: 'https://brand.example',
        descriptionText: '',
        pdfS3Key: null,
      },
    })
    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalled()
    })
    const body = mockCreateCampaign.mock.calls[0]![0]
    expect(body.brief.scoring_dimensions).toEqual([
      { name: 'Engagement', weight_pct: 100 },
    ])
  })

  it('sends Idempotency-Key header', async () => {
    const { result } = renderHook(() => useCreateCampaign(), { wrapper })
    result.current.mutate({
      idempotencyKey: 'idem-xyz',
      draft: makeDraft(),
      source: {
        websiteUrl: 'https://brand.example',
        descriptionText: '',
        pdfS3Key: null,
      },
    })
    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalled()
    })
    const opts = mockCreateCampaign.mock.calls[0]![1]
    expect(opts.headers['Idempotency-Key']).toBe('idem-xyz')
  })

  it('maps source fields to brief_source_url/text and brief_pdf_s3_key', async () => {
    const { result } = renderHook(() => useCreateCampaign(), { wrapper })
    result.current.mutate({
      idempotencyKey: 'idem-src',
      draft: makeDraft(),
      source: {
        websiteUrl: 'https://brand.example',
        descriptionText: 'desc',
        pdfS3Key: 's3/key/abc.pdf',
      },
    })
    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalled()
    })
    const body = mockCreateCampaign.mock.calls[0]![0]
    expect(body.brief.brief_source_url).toBe('https://brand.example')
    expect(body.brief.brief_source_text).toBe('desc')
    expect(body.brief.brief_pdf_s3_key).toBe('s3/key/abc.pdf')
  })
})
