import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { P4Confirm } from './P4Confirm'
import { useBriefBuilderStore } from '../store'
import type { BriefDraft } from '../store'

const mockNavigate = vi.fn().mockResolvedValue(undefined)
const mockRouter = {
  navigate: mockNavigate,
}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useRouter: () => mockRouter,
}))

const mockMutate = vi.fn()
const mockMutationState = {
  mutate: mockMutate,
  isPending: false,
  isError: false,
  isSuccess: false,
  status: 'idle' as 'idle' | 'pending' | 'success' | 'error',
  data: undefined as { campaign_id: string } | undefined,
  error: null as unknown,
}

vi.mock('../hooks/useCreateCampaign', () => ({
  useCreateCampaign: () => mockMutationState,
  getCreateCampaignFieldErrors: (error: unknown) => {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status: number }).status === 422 &&
      'details' in error
    ) {
      const details = (
        error as { details?: { field_errors?: Record<string, string[]> } }
      ).details
      return details?.field_errors ?? null
    }
    return null
  },
}))

const mockToastError = vi.fn()
const mockToastInfo = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
  },
}))

function makeDraft(overrides?: Partial<BriefDraft>): BriefDraft {
  return {
    campaign: {
      name: 'Mi campaña',
      objective: 'brand_awareness',
      budget_amount: 5000,
      budget_currency: 'USD',
      deadline: '',
      ...overrides?.campaign,
    },
    brief: {
      icp_description: 'Creadores fitness',
      icp_age_min: 18,
      icp_age_max: 35,
      icp_genders: ['male', 'female'],
      icp_countries: ['AR'],
      icp_platforms: ['instagram', 'tiktok'],
      icp_interests: ['fitness'],
      scoring_dimensions: [
        {
          id: 'dim-1',
          name: 'Engagement',
          description: 'Engagement rate',
          weight_pct: 100,
          positive_signals: [],
          negative_signals: [],
        },
      ],
      hard_filters: [],
      disqualifiers: [],
      ...overrides?.brief,
    },
  }
}

function renderP4() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <P4Confirm />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useBriefBuilderStore.getState().reset()
  mockMutate.mockReset()
  mockNavigate.mockReset().mockResolvedValue(undefined)
  mockToastError.mockReset()
  mockToastInfo.mockReset()
  mockMutationState.isPending = false
  mockMutationState.isError = false
  mockMutationState.isSuccess = false
  mockMutationState.status = 'idle'
  mockMutationState.data = undefined
  mockMutationState.error = null
})

describe('P4Confirm', () => {
  it('shows fallback when no draft exists', () => {
    renderP4()
    expect(screen.getByText(/sin brief disponible/i)).toBeInTheDocument()
  })

  it('fires mutation on mount with correct body and Idempotency-Key', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    renderP4()

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const [params] = mockMutate.mock.calls[0] as [
      {
        idempotencyKey: string
        draft: BriefDraft
        source: {
          websiteUrl: string
          descriptionText: string
          pdfS3Key: string | null
        }
      },
    ]
    expect(params.draft.campaign.name).toBe('Mi campaña')
    expect(params.draft.campaign.objective).toBe('brand_awareness')
    expect(params.idempotencyKey).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
    )
  })

  it('persists campaignId in the store when the mutation succeeds', async () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isSuccess = true
    mockMutationState.status = 'success'
    mockMutationState.data = { campaign_id: 'camp-123' }
    renderP4()

    await waitFor(() => {
      expect(useBriefBuilderStore.getState().campaignId).toBe('camp-123')
    })
  })

  it('shows spinner when pending', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isPending = true
    mockMutationState.status = 'pending'
    renderP4()
    expect(screen.getByText(/creando tu campaña/i)).toBeInTheDocument()
  })

  it('renders success state with "Configurar campaña" CTA', () => {
    useBriefBuilderStore.setState({
      briefDraft: makeDraft(),
      campaignId: 'camp-123',
    })
    mockMutationState.isSuccess = true
    mockMutationState.status = 'success'
    mockMutationState.data = { campaign_id: 'camp-123' }
    renderP4()

    expect(screen.getByText(/campaña creada/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /configurar campaña/i }),
    ).toBeInTheDocument()
  })

  it('navigates to /campaigns/<id>/configuration on CTA click', async () => {
    const user = userEvent.setup()
    useBriefBuilderStore.setState({
      briefDraft: makeDraft(),
      campaignId: 'camp-123',
    })
    mockMutationState.isSuccess = true
    mockMutationState.status = 'success'
    mockMutationState.data = { campaign_id: 'camp-123' }
    renderP4()

    await user.click(
      screen.getByRole('button', { name: /configurar campaña/i }),
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/campaigns/$campaignId/configuration',
        params: { campaignId: 'camp-123' },
        search: {
          tab: 'overview',
          section: 'matches',
          from: 'brief-builder',
        },
      })
    })
  })

  it('shows error state with retry and back buttons', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isError = true
    mockMutationState.status = 'error'
    mockMutationState.error = new Error('Server error')
    renderP4()

    expect(screen.getByText(/error al crear la campaña/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /volver al formulario/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /volver a intentar/i }),
    ).toBeInTheDocument()
  })

  it('handles 422 error with field errors — no retry button', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isError = true
    mockMutationState.status = 'error'
    mockMutationState.error = {
      status: 422,
      details: { field_errors: { name: ['El nombre es requerido'] } },
    }
    renderP4()

    expect(
      screen.getByRole('button', { name: /volver al formulario/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /volver a intentar/i }),
    ).not.toBeInTheDocument()
  })

  it('disables CTAs when mutation is pending', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isPending = true
    mockMutationState.status = 'pending'
    renderP4()
    // Pending state shows spinner, not CTAs
    expect(screen.getByText(/creando tu campaña/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /configurar campaña/i }),
    ).not.toBeInTheDocument()
  })

  it('has no accessibility violations in success state', async () => {
    useBriefBuilderStore.setState({
      briefDraft: makeDraft(),
      campaignId: 'camp-123',
    })
    mockMutationState.isSuccess = true
    mockMutationState.status = 'success'
    mockMutationState.data = { campaign_id: 'camp-123' }
    const { container } = renderP4()
    expect(await axe(container)).toHaveNoViolations()
  })
})
