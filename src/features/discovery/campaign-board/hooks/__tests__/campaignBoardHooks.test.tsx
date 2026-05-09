import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '#/shared/api/mutator'
import type {
  CreatorCampaignBoardCard,
  CreatorCampaignBoardDetailResponse,
  CreatorCampaignBoardResponse,
  SubmitCampaignApplicationResponse,
} from '#/shared/api/generated/model'

import { listCreatorCampaignBoard } from '../../api/listCreatorCampaignBoard'
import { getCreatorCampaignBoardDetail } from '../../api/getCreatorCampaignBoardDetail'
import { submitCampaignApplication } from '../../api/submitCampaignApplication'
import type { SubmitCampaignApplicationInput } from '../../api/submitCampaignApplication'
import {
  campaignBoardQueryKey,
  useCampaignBoardQuery,
} from '../useCampaignBoardQuery'
import {
  campaignBoardDetailQueryKey,
  useCampaignBoardDetailQuery,
} from '../useCampaignBoardDetailQuery'
import { useSubmitCampaignApplicationMutation } from '../useSubmitCampaignApplicationMutation'

vi.mock('../../api/listCreatorCampaignBoard', () => ({
  listCreatorCampaignBoard: vi.fn(),
  normalizeCampaignBoardSearch: vi.fn(
    (search?: { recommended_only?: boolean }) => ({
      ...search,
      recommended_only: search?.recommended_only ?? false,
    }),
  ),
}))

vi.mock('../../api/getCreatorCampaignBoardDetail', () => ({
  getCreatorCampaignBoardDetail: vi.fn(),
}))

vi.mock('../../api/submitCampaignApplication', () => ({
  submitCampaignApplication: vi.fn(),
}))

const mockListCreatorCampaignBoard = vi.mocked(listCreatorCampaignBoard)
const mockGetCreatorCampaignBoardDetail = vi.mocked(
  getCreatorCampaignBoardDetail,
)
const mockSubmitCampaignApplication = vi.mocked(submitCampaignApplication)

const CAMPAIGN_ID = '11111111-1111-4111-8111-111111111111'
const APPLICATION_ID = '22222222-2222-4222-8222-222222222222'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function makeCard(
  overrides?: Partial<CreatorCampaignBoardCard>,
): CreatorCampaignBoardCard {
  return {
    campaign_id: CAMPAIGN_ID,
    brand: {},
    campaign: {},
    economics: {},
    targeting: {
      niches: ['beauty'],
      interests: ['skincare'],
      platforms: ['instagram'],
      deliverables: ['reel'],
      fee_min: null,
      fee_max: null,
    },
    match: {
      score: 91,
      score_raw: '91.0',
      band: 'high',
      recommended: true,
      hard_filters_passed: true,
      profile_complete: true,
      positive_reasons: ['Strong fit'],
      mismatch_reasons: [],
    },
    application: {
      status: 'none',
      application_id: null,
      submitted_at: null,
      can_apply: true,
    },
    published_at: '2026-05-09T08:00:00.000Z',
    ...overrides,
  }
}

function makeBoardResponse(
  card: CreatorCampaignBoardCard = makeCard(),
): CreatorCampaignBoardResponse {
  return {
    data: [card],
    counts: {
      total_visible: 1,
      recommended: 1,
      matching_filters: 1,
    },
    filters: {
      applied: {
        recommended_only: false,
      },
      available: {
        niches: ['beauty'],
        interests: ['skincare'],
        platforms: ['instagram'],
        deliverables: ['reel'],
        match_score_min: 0,
        match_score_max: 100,
      },
    },
    next_cursor: null,
    generated_at: '2026-05-09T08:00:00.000Z',
  }
}

function makeDetailResponse(
  card: CreatorCampaignBoardCard = makeCard(),
): CreatorCampaignBoardDetailResponse {
  return {
    card,
    brief: {},
    targeting: {},
    commercial: {},
    application: card.application,
    generated_at: '2026-05-09T08:00:00.000Z',
  }
}

function makeSubmitResponse(): SubmitCampaignApplicationResponse {
  return {
    application: {
      application_id: APPLICATION_ID,
      campaign_id: CAMPAIGN_ID,
      status: 'submitted',
      message: 'I want to join',
      submitted_at: '2026-05-09T08:10:00.000Z',
    },
    idempotent_replay: false,
  }
}

function isSubmitCampaignApplicationCall(
  value: unknown,
): value is { data: SubmitCampaignApplicationInput } {
  if (typeof value !== 'object' || value === null) return false
  if (!('data' in value)) return false
  const data = value.data
  if (typeof data !== 'object' || data === null) return false
  if (!('idempotencyKey' in data)) return false
  return typeof data.idempotencyKey === 'string'
}

describe('campaign board hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the campaign board list with recommended_only=false by default', async () => {
    mockListCreatorCampaignBoard.mockResolvedValue(makeBoardResponse())
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCampaignBoardQuery(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(makeBoardResponse())
    expect(mockListCreatorCampaignBoard).toHaveBeenCalledWith({
      data: { recommended_only: false },
    })
    expect(
      queryClient.getQueryState(
        campaignBoardQueryKey({ recommended_only: false }),
      ),
    ).toBeDefined()
  })

  it('loads campaign board detail', async () => {
    mockGetCreatorCampaignBoardDetail.mockResolvedValue(makeDetailResponse())
    const queryClient = createTestQueryClient()

    const { result } = renderHook(
      () => useCampaignBoardDetailQuery(CAMPAIGN_ID),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(makeDetailResponse())
    expect(mockGetCreatorCampaignBoardDetail).toHaveBeenCalledWith({
      data: CAMPAIGN_ID,
    })
    expect(
      queryClient.getQueryState(campaignBoardDetailQueryKey(CAMPAIGN_ID)),
    ).toBeDefined()
  })

  it('submits an application, sends a UUID idempotency key, and patches cached cards', async () => {
    const queryClient = createTestQueryClient()
    const originalCard = makeCard()
    queryClient.setQueryData(campaignBoardQueryKey({ q: 'skin' }), {
      ...makeBoardResponse(originalCard),
    })
    queryClient.setQueryData(
      campaignBoardDetailQueryKey(CAMPAIGN_ID),
      makeDetailResponse(originalCard),
    )
    mockSubmitCampaignApplication.mockResolvedValue(makeSubmitResponse())

    const { result } = renderHook(
      () => useSubmitCampaignApplicationMutation(),
      { wrapper: createWrapper(queryClient) },
    )

    let mutationResult:
      | Awaited<ReturnType<typeof result.current.mutateAsync>>
      | undefined
    await act(async () => {
      mutationResult = await result.current.mutateAsync({
        campaignId: CAMPAIGN_ID,
        data: { message: 'I want to join' },
      })
    })

    expect(mutationResult?.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(mockSubmitCampaignApplication).toHaveBeenCalledWith({
      data: {
        campaignId: CAMPAIGN_ID,
        data: { message: 'I want to join' },
        idempotencyKey: mutationResult?.idempotencyKey,
      },
    })

    const board = queryClient.getQueryData<CreatorCampaignBoardResponse>(
      campaignBoardQueryKey({ q: 'skin' }),
    )
    const detail = queryClient.getQueryData<CreatorCampaignBoardDetailResponse>(
      campaignBoardDetailQueryKey(CAMPAIGN_ID),
    )

    expect(board?.data[0]?.application).toEqual({
      status: 'submitted',
      application_id: APPLICATION_ID,
      submitted_at: '2026-05-09T08:10:00.000Z',
      can_apply: false,
    })
    expect(detail?.application).toEqual(board?.data[0]?.application)
    expect(detail?.card.application).toEqual(board?.data[0]?.application)
  })

  it('surfaces 409 application_already_exists errors', async () => {
    const error = new ApiError(
      409,
      'application_already_exists',
      'Application already exists',
    )
    mockSubmitCampaignApplication.mockRejectedValue(error)
    const queryClient = createTestQueryClient()

    const { result } = renderHook(
      () => useSubmitCampaignApplicationMutation(),
      { wrapper: createWrapper(queryClient) },
    )

    await expect(
      result.current.mutateAsync({
        campaignId: CAMPAIGN_ID,
        data: { message: 'I want to join' },
      }),
    ).rejects.toBe(error)
    await waitFor(() => {
      expect(result.current.error).toBe(error)
    })
  })

  it('surfaces 409 idempotency_conflict and regenerates the key on the next submit attempt', async () => {
    const error = new ApiError(
      409,
      'idempotency_conflict',
      'Idempotency conflict',
    )
    mockSubmitCampaignApplication
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(makeSubmitResponse())
    const queryClient = createTestQueryClient()

    const { result } = renderHook(
      () => useSubmitCampaignApplicationMutation(),
      { wrapper: createWrapper(queryClient) },
    )

    await expect(
      result.current.mutateAsync({
        campaignId: CAMPAIGN_ID,
        data: { message: 'I want to join' },
      }),
    ).rejects.toBe(error)

    const firstCall = mockSubmitCampaignApplication.mock.calls[0]?.[0]

    let secondAttempt:
      | Awaited<ReturnType<typeof result.current.mutateAsync>>
      | undefined
    await act(async () => {
      secondAttempt = await result.current.mutateAsync({
        campaignId: CAMPAIGN_ID,
        data: { message: 'I want to join' },
      })
    })

    const secondCall = mockSubmitCampaignApplication.mock.calls[1]?.[0]
    if (
      !isSubmitCampaignApplicationCall(firstCall) ||
      !isSubmitCampaignApplicationCall(secondCall)
    ) {
      throw new Error('Expected submit calls')
    }

    expect(firstCall.data.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(secondCall.data.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(secondCall.data.idempotencyKey).not.toBe(
      firstCall.data.idempotencyKey,
    )
    expect(secondAttempt?.idempotencyKey).toBe(secondCall.data.idempotencyKey)
  })
})
