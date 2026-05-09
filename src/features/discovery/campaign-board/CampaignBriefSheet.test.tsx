import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '#/shared/api/mutator'
import type {
  CreatorCampaignBoardCard,
  CreatorCampaignBoardDetailResponse,
} from '#/shared/api/generated/model'

import { CampaignBriefSheet } from './CampaignBriefSheet'
import { useCampaignBoardDetailQuery } from './hooks/useCampaignBoardDetailQuery'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

vi.mock('./hooks/useCampaignBoardDetailQuery', () => ({
  useCampaignBoardDetailQuery: vi.fn(),
}))

const mockUseCampaignBoardDetailQuery = vi.mocked(useCampaignBoardDetailQuery)
const campaignId = '11111111-1111-4111-8111-111111111111'

function makeCard(): CreatorCampaignBoardCard {
  return {
    campaign_id: campaignId,
    brand: {
      brand_workspace_id: '22222222-2222-4222-8222-222222222222',
      name: 'Marz Audio',
      logo_url: null,
      avatar_initials: 'MA',
      vertical: 'tech',
    },
    campaign: {
      name: 'Lanzamiento auriculares M-Pro 2',
      objective: 'brand_awareness',
      description_preview: 'Preview',
      deadline: '2026-05-12',
      platforms: [],
      deliverables: [],
      content_type: 'ugc_videos',
    },
    economics: {
      fee_model: 'fixed_per_video',
      fee_min_amount: '250',
      fee_max_amount: '500',
      fee_label: 'USD 250 - 500',
    },
    targeting: {
      niches: ['tech'],
      interests: ['audio'],
      platforms: ['youtube'],
      deliverables: ['long_form'],
      fee_min: '250',
      fee_max: '500',
    },
    match: {
      score: 94,
      score_raw: '94.00',
      band: 'high',
      recommended: true,
      hard_filters_passed: true,
      profile_complete: true,
      positive_reasons: [],
      mismatch_reasons: [],
    },
    application: {
      status: 'none',
      application_id: null,
      submitted_at: null,
      can_apply: true,
    },
    published_at: '2026-05-09T08:00:00.000Z',
  }
}

function makeDetailResponse(): CreatorCampaignBoardDetailResponse {
  const card = makeCard()

  return {
    card,
    brief: {
      description: 'Brief completo',
      tone: 'Honesto',
      key_messages: ['Mensaje principal'],
      do_list: [],
      dont_list: [],
      icp: {},
      scoring_dimensions: [],
    },
    targeting: {},
    commercial: {
      fee_label: 'USD 250 - 500',
    },
    application: card.application,
    generated_at: '2026-05-09T08:00:00.000Z',
  }
}

function mockDetailQuery(
  state: Partial<ReturnType<typeof useCampaignBoardDetailQuery>>,
) {
  mockUseCampaignBoardDetailQuery.mockReturnValue({
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    isSuccess: false,
    ...state,
  } as ReturnType<typeof useCampaignBoardDetailQuery>)
}

describe('CampaignBriefSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enables the detail query only while open and keeps a fresh cache window', () => {
    mockDetailQuery({})

    const { rerender } = render(
      <CampaignBriefSheet
        campaignId={null}
        onOpenChange={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    expect(mockUseCampaignBoardDetailQuery).toHaveBeenLastCalledWith('', {
      enabled: false,
      staleTime: 60_000,
    })

    rerender(
      <CampaignBriefSheet
        campaignId={campaignId}
        onOpenChange={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    expect(mockUseCampaignBoardDetailQuery).toHaveBeenLastCalledWith(
      campaignId,
      {
        enabled: true,
        staleTime: 60_000,
      },
    )
  })

  it('renders loaded brief content with an application CTA', () => {
    mockDetailQuery({
      data: makeDetailResponse(),
      isSuccess: true,
    })

    render(
      <CampaignBriefSheet
        campaignId={campaignId}
        onOpenChange={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('dialog', { name: 'Brief de campaña' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Brief completo')).toBeInTheDocument()
    expect(screen.getByText('Mensaje principal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Postularme' })).toBeEnabled()
  })

  it('opens the application dialog from the sheet CTA', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    const response = makeDetailResponse()
    mockDetailQuery({
      data: response,
      isSuccess: true,
    })

    render(
      <CampaignBriefSheet
        campaignId={campaignId}
        onOpenChange={vi.fn()}
        onApply={onApply}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Postularme' }))

    expect(onApply).toHaveBeenCalledWith(response.card)
  })

  it('allows closing the not-found state', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    mockDetailQuery({
      error: new ApiError(404, 'campaign_board_listing_not_found', 'Not found'),
      isError: true,
    })

    render(
      <CampaignBriefSheet
        campaignId={campaignId}
        onOpenChange={onOpenChange}
        onApply={vi.fn()}
      />,
    )

    expect(screen.getByText('Brief no encontrado')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders campaign-not-available state', () => {
    mockDetailQuery({
      error: new ApiError(409, 'campaign_not_available', 'Conflict'),
      isError: true,
    })

    render(
      <CampaignBriefSheet
        campaignId={campaignId}
        onOpenChange={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    expect(screen.getByText('Campaña no disponible')).toBeInTheDocument()
  })

  it('has no axe violations when loaded', async () => {
    mockDetailQuery({
      data: makeDetailResponse(),
      isSuccess: true,
    })

    const { container } = render(
      <CampaignBriefSheet
        campaignId={campaignId}
        onOpenChange={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violations while loading', async () => {
    mockDetailQuery({
      isPending: true,
    })

    const { container } = render(
      <CampaignBriefSheet
        campaignId={campaignId}
        onOpenChange={vi.fn()}
        onApply={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('status', { name: 'Cargando brief' }),
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
