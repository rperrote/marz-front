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
  useRouter: () => mockRouter,
}))

const mockMutate = vi.fn()
const mockMutationState = {
  mutate: mockMutate,
  isPending: false,
  isError: false,
  isSuccess: false,
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
      { brandWorkspaceId: string; idempotencyKey: string; draft: BriefDraft },
    ]
    expect(params.draft.campaign.name).toBe('Mi campaña')
    expect(params.draft.campaign.objective).toBe('brand_awareness')
    expect(params.idempotencyKey).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
    )
  })

  it('shows spinner when pending', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isPending = true
    renderP4()
    expect(screen.getByText(/creando tu campaña/i)).toBeInTheDocument()
  })

  it('renders success state with CTAs', () => {
    useBriefBuilderStore.setState({
      briefDraft: makeDraft(),
      campaignId: 'camp-123',
    })
    mockMutationState.isSuccess = true
    renderP4()

    expect(screen.getByText(/campaña creada/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /ir al marketplace/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /ver resumen del brief/i }),
    ).toBeInTheDocument()
  })

  it('navigates to marketplace on CTA click', async () => {
    const user = userEvent.setup()
    useBriefBuilderStore.setState({
      briefDraft: makeDraft(),
      campaignId: 'camp-123',
    })
    mockMutationState.isSuccess = true
    renderP4()

    await user.click(screen.getByRole('button', { name: /ir al marketplace/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  it('falls back to / with toast when marketplace route throws', async () => {
    const user = userEvent.setup()
    useBriefBuilderStore.setState({
      briefDraft: makeDraft(),
      campaignId: 'camp-123',
    })
    mockMutationState.isSuccess = true
    mockNavigate.mockRejectedValueOnce(new Error('route not found'))
    renderP4()

    await user.click(screen.getByRole('button', { name: /ir al marketplace/i }))

    await waitFor(() => {
      expect(mockToastInfo).toHaveBeenCalledWith(
        expect.stringContaining('marketplace'),
      )
      expect(mockNavigate).toHaveBeenLastCalledWith({ to: '/' })
    })
  })

  it('shows error state with retry and back buttons', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isError = true
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

  it('retry uses same Idempotency-Key', async () => {
    const user = userEvent.setup()
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isError = true
    mockMutationState.error = new Error('Server error')
    renderP4()

    const firstCallKey = (
      mockMutate.mock.calls[0] as [{ idempotencyKey: string }]
    )[0].idempotencyKey

    await user.click(screen.getByRole('button', { name: /volver a intentar/i }))

    expect(mockMutate).toHaveBeenCalledTimes(2)
    const retryCallKey = (
      mockMutate.mock.calls[1] as [{ idempotencyKey: string }]
    )[0].idempotencyKey
    expect(retryCallKey).toBe(firstCallKey)
  })

  it('opens brief summary dialog on CTA click', async () => {
    const user = userEvent.setup()
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isSuccess = true
    renderP4()

    await user.click(
      screen.getByRole('button', { name: /ver resumen del brief/i }),
    )

    await waitFor(() => {
      expect(screen.getByText('Resumen del brief')).toBeInTheDocument()
      expect(screen.getByText('Mi campaña')).toBeInTheDocument()
    })
  })

  it('disables CTAs when mutation is pending', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    mockMutationState.isPending = true
    renderP4()
    // Pending state shows spinner, not CTAs
    expect(screen.getByText(/creando tu campaña/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /ir al marketplace/i }),
    ).not.toBeInTheDocument()
  })

  it('has no accessibility violations in success state', async () => {
    useBriefBuilderStore.setState({
      briefDraft: makeDraft(),
      campaignId: 'camp-123',
    })
    mockMutationState.isSuccess = true
    const { container } = renderP4()
    expect(await axe(container)).toHaveNoViolations()
  })
})
