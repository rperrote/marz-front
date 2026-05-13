import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  CreatorCampaignBoardCard,
  CreatorCampaignBoardResponse,
} from '#/shared/api/generated/model'

import { CampaignBoardPage } from './CampaignBoardPage'
import { formatDeadline } from './CampaignBoardCard'
import { useBoardSearchSync } from './hooks/useBoardSearchSync'
import { useCampaignBoardQuery } from './hooks/useCampaignBoardQuery'
import type { CampaignBoardSearch } from './search-schema'
import { trackBoardEvent } from './utils/analytics'

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

vi.mock('./hooks/useCampaignBoardQuery', () => ({
  useCampaignBoardQuery: vi.fn(),
}))

vi.mock('./hooks/useBoardSearchSync', () => ({
  useBoardSearchSync: vi.fn(),
}))

vi.mock('./utils/analytics', () => ({
  trackBoardEvent: vi.fn(),
}))

vi.mock('./CampaignBriefSheet', () => ({
  CampaignBriefSheet: ({
    campaignId,
    onOpenChange,
    onApply,
  }: {
    campaignId: string | null
    onOpenChange: (open: boolean) => void
    onApply: (card: CreatorCampaignBoardCard) => void
  }) =>
    campaignId ? (
      <div role="dialog" aria-label="Brief de campaña">
        <p>{campaignId}</p>
        <button
          type="button"
          onClick={() =>
            onApply({
              campaign_id: campaignId,
              brand: {
                id: 'brand-1',
                name: 'Brand',
                logo_url: null,
              },
              campaign: { name: 'Brief campaign' },
              economics: {
                pricing_model: 'fixed',
                currency: 'USD',
                budget: '100.00',
              },
              targeting: {
                niches: [],
                interests: [],
                platforms: [],
                deliverables: [],
                fee_min: null,
                fee_max: null,
              },
              match: {
                score: 85,
                score_raw: '85',
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
              published_at: '2026-05-13T00:00:00.000Z',
            })
          }
        >
          Postularme desde brief
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          Cerrar
        </button>
      </div>
    ) : null,
}))

vi.mock('./ApplicationDialog', () => ({
  ApplicationDialog: ({
    open,
    campaignName,
    onSubmitted,
  }: {
    open: boolean
    campaignName?: string
    onSubmitted?: () => void
  }) =>
    open ? (
      <div role="dialog" aria-label="Postularme">
        {campaignName}
        <button type="button" onClick={onSubmitted}>
          Enviar mock
        </button>
      </div>
    ) : null,
}))

const mockUseCampaignBoardQuery = vi.mocked(useCampaignBoardQuery)
const mockUseBoardSearchSync = vi.mocked(useBoardSearchSync)
const mockTrackBoardEvent = vi.mocked(trackBoardEvent)

const baseSearch: CampaignBoardSearch = {
  recommended_only: false,
  sort: 'match_score_desc',
}
const setSearch = vi.fn()
const resetSearch = vi.fn()

const campaignId = '11111111-1111-4111-8111-111111111111'

function makeCard(
  overrides?: Partial<CreatorCampaignBoardCard>,
): CreatorCampaignBoardCard {
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
      description_preview:
        'Buscamos creators tech para review honesto del nuevo flagship.',
      deadline: '2026-05-12',
      platforms: [{ platform: 'youtube', format: 'long_form' }],
      deliverables: [
        { platform: 'youtube', format: 'long_form', quantity: 1 },
        { platform: 'instagram', format: 'reel', quantity: 2 },
      ],
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
      platforms: ['youtube', 'instagram'],
      deliverables: ['long_form', 'reel'],
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
      positive_reasons: ['Buen fit'],
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
  data: CreatorCampaignBoardCard[] = [makeCard()],
): CreatorCampaignBoardResponse {
  return {
    data,
    counts: {
      total_visible: 24,
      recommended: 12,
      matching_filters: data.length,
    },
    filters: {
      applied: {
        recommended_only: false,
      },
      available: {
        niches: ['tech'],
        interests: ['audio'],
        platforms: ['youtube'],
        deliverables: ['long_form'],
        match_score_min: 0,
        match_score_max: 100,
      },
    },
    next_cursor: null,
    generated_at: '2026-05-09T08:00:00.000Z',
  }
}

function mockBoardQuery(state: {
  data?: CreatorCampaignBoardResponse
  isPending?: boolean
  isError?: boolean
  isSuccess?: boolean
  isFetching?: boolean
}) {
  mockUseCampaignBoardQuery.mockReturnValue({
    data: state.data,
    isPending: state.isPending ?? false,
    isError: state.isError ?? false,
    isSuccess: state.isSuccess ?? false,
    isFetching: state.isFetching ?? false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCampaignBoardQuery>)
}

function renderCampaignBoardPage(search: CampaignBoardSearch = baseSearch) {
  mockUseBoardSearchSync.mockReturnValue({
    search,
    setSearch,
    resetSearch,
  })
  return render(<CampaignBoardPage />)
}

describe('CampaignBoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders counts and campaign cards from the endpoint response', () => {
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    renderCampaignBoardPage()

    expect(
      screen.getByRole('heading', { name: /campañas abiertas/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 campañas')).toBeInTheDocument()
    expect(screen.getByText('12 recomendadas para vos')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Lanzamiento auriculares M-Pro 2',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Marz Audio')).toBeInTheDocument()
    expect(screen.getByText('USD 250 - 500')).toBeInTheDocument()
    expect(screen.getByText('Youtube · Long Form')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Postularme' })).toBeEnabled()
  })

  it('tracks the board view after data loads', () => {
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    renderCampaignBoardPage()

    expect(mockTrackBoardEvent).toHaveBeenCalledWith('campaign_board_viewed', {
      total_campaigns: 24,
      recommended_campaigns: 12,
    })
  })

  it('does not track the board view while loading', () => {
    mockBoardQuery({ isPending: true, isFetching: true })

    renderCampaignBoardPage()

    expect(mockTrackBoardEvent).not.toHaveBeenCalledWith(
      'campaign_board_viewed',
      expect.anything(),
    )
  })

  it('renders submitted state with a link to view the application', () => {
    mockBoardQuery({
      data: makeBoardResponse([
        makeCard({
          application: {
            status: 'submitted',
            application_id: '33333333-3333-4333-8333-333333333333',
            submitted_at: '2026-05-09T08:00:00.000Z',
            can_apply: false,
          },
        }),
      ]),
      isSuccess: true,
    })

    renderCampaignBoardPage()

    expect(screen.getByText('Postulación enviada')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ver postulación' }),
    ).toBeEnabled()
  })

  it('opens the application dialog from a campaign card', async () => {
    const user = userEvent.setup()
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    renderCampaignBoardPage()

    await user.click(screen.getByRole('button', { name: 'Postularme' }))

    expect(
      screen.getByRole('dialog', { name: 'Postularme' }),
    ).toHaveTextContent('Lanzamiento auriculares M-Pro 2')
    expect(mockTrackBoardEvent).toHaveBeenCalledWith(
      'campaign_board_application_started',
      {
        match_score_range: 'high',
        recommended: true,
      },
    )
  })

  it('tracks application submission from the dialog callback', async () => {
    const user = userEvent.setup()
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    renderCampaignBoardPage()

    await user.click(screen.getByRole('button', { name: 'Postularme' }))
    await user.click(screen.getByRole('button', { name: 'Enviar mock' }))

    expect(mockTrackBoardEvent).toHaveBeenCalledWith(
      'campaign_board_application_submitted',
      {
        match_score_range: 'high',
        recommended: true,
      },
    )
  })

  it('opens the brief sheet from a campaign card', async () => {
    const user = userEvent.setup()
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    renderCampaignBoardPage()

    await user.click(screen.getByRole('button', { name: 'Ver brief' }))

    expect(
      screen.getByRole('dialog', { name: 'Brief de campaña' }),
    ).toHaveTextContent(campaignId)
    expect(mockTrackBoardEvent).toHaveBeenCalledWith(
      'campaign_board_brief_opened',
      {
        match_score_range: 'high',
        recommended: true,
      },
    )
  })

  it('renders loading skeletons', () => {
    mockBoardQuery({ isPending: true, isFetching: true })

    renderCampaignBoardPage()

    expect(screen.getByLabelText('Cargando campañas')).toBeInTheDocument()
  })

  it('renders an error fallback', () => {
    mockBoardQuery({ isError: true })

    renderCampaignBoardPage()

    expect(
      screen.getByRole('heading', { name: 'No pudimos cargar las campañas' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Actualizar' })).toHaveLength(
      2,
    )
    expect(mockTrackBoardEvent).toHaveBeenCalledWith(
      'campaign_board_empty_state_seen',
      {
        empty_state_type: 'error',
      },
    )
  })

  it('renders the no-campaigns empty state', () => {
    mockBoardQuery({
      data: {
        ...makeBoardResponse([]),
        counts: {
          total_visible: 0,
          recommended: 0,
          matching_filters: 0,
        },
      },
      isSuccess: true,
    })

    renderCampaignBoardPage()

    expect(
      screen.getByRole('heading', { name: 'Sin campañas por ahora' }),
    ).toBeInTheDocument()
    expect(mockTrackBoardEvent).toHaveBeenCalledWith(
      'campaign_board_empty_state_seen',
      {
        empty_state_type: 'no_campaigns',
      },
    )
  })

  it('tracks filtered changes from filters', async () => {
    const user = userEvent.setup()
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    renderCampaignBoardPage()

    await user.click(
      screen.getByRole('switch', { name: 'Solo recomendadas para mí' }),
    )

    expect(mockTrackBoardEvent).toHaveBeenCalledWith(
      'campaign_board_filtered',
      {
        filter_types: ['recommended_only'],
        recommended_only: true,
      },
    )
  })

  it('tracks sorted changes from the sort control', async () => {
    const user = userEvent.setup()
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    renderCampaignBoardPage()

    await user.click(screen.getByRole('combobox', { name: 'Ordenar campañas' }))
    await user.click(screen.getByRole('option', { name: 'Fee más alto' }))

    expect(mockTrackBoardEvent).toHaveBeenCalledWith('campaign_board_sorted', {
      sort_option: 'fee_desc',
    })
  })

  it('tracks searched changes after debounce', async () => {
    const user = userEvent.setup()
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    renderCampaignBoardPage()

    await user.type(screen.getByLabelText('Buscar campañas'), 'tech')

    await waitFor(() => {
      expect(mockTrackBoardEvent).toHaveBeenCalledWith(
        'campaign_board_searched',
        {
          has_query: true,
        },
      )
    })
  })

  it('has no axe violations on the loaded page', async () => {
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    const { container } = renderCampaignBoardPage()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('toggles recommended-only search from filters', async () => {
    const user = userEvent.setup()
    mockBoardQuery({ data: makeBoardResponse(), isSuccess: true })

    renderCampaignBoardPage()

    await user.click(
      screen.getByRole('switch', { name: 'Solo recomendadas para mí' }),
    )

    expect(setSearch).toHaveBeenCalledWith({ recommended_only: true })
  })
})

describe('formatDeadline', () => {
  const now = new Date('2026-05-09T15:00:00.000Z')

  it.each([
    ['2026-05-09', 'Hoy'],
    ['2026-05-10', 'Mañana'],
    ['2026-05-12', 'En 3 días'],
    ['2026-05-08', 'Venció'],
  ])('formats %s relative to a fixed date', (deadline, expected) => {
    expect(formatDeadline(deadline, now)).toBe(expected)
  })
})
