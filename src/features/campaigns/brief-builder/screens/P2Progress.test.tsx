import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '#/shared/api/mutator'
import { P2Progress } from './P2Progress'
import { useBriefBuilderStore } from '../store'
import type { BriefDraft } from '../store'
import type {
  ProcessingStep,
  ProcessingStatus,
} from '../hooks/useBriefBuilderWS'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

const mockRouterNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ navigate: mockRouterNavigate }),
}))

type MutateOptions = {
  onError?: (error: unknown) => void
  onSuccess?: () => void
}
const mockMutate = vi.fn(
  (_token: string, _options?: MutateOptions): void => undefined,
)
let mockIsPending = false
let mockMutateError: unknown = null

vi.mock('../analytics/brief-builder-analytics', () => ({
  trackBriefBuilderStarted: vi.fn(),
}))

vi.mock('../hooks/useProcessBrief', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useProcessBrief: () => ({
      mutate: (token: string, options?: MutateOptions) => {
        mockMutate(token, options)
        if (mockMutateError && options?.onError) {
          options.onError(mockMutateError)
        }
      },
      isPending: mockIsPending,
    }),
  }
})

const MOCK_DRAFT: BriefDraft = {
  campaign: {
    name: 'Test Brief',
    objective: 'brand_awareness',
    budget_amount: 5000,
    budget_currency: 'USD',
    deadline: '',
  },
  brief: {
    icp_description: 'Gen Z creators',
    icp_age_min: 18,
    icp_age_max: 30,
    icp_genders: ['male', 'female'],
    icp_countries: ['US'],
    icp_platforms: ['instagram'],
    icp_interests: ['fitness'],
    scoring_dimensions: [
      {
        id: 'test-dim-1',
        name: 'Engagement',
        description: 'Rate',
        weight_pct: 100,
        positive_signals: [],
        negative_signals: [],
      },
    ],
    hard_filters: [],
    disqualifiers: [],
  },
}

function buildSteps(
  overrides: Partial<Record<number, Partial<ProcessingStep>>> = {},
): ProcessingStep[] {
  const names = [
    'reading_website',
    'processing_description',
    'generating_icp',
    'generating_scoring',
    'generating_filters',
  ] as const
  const labels = [
    'Leyendo sitio web',
    'Procesando descripción',
    'Generando ICP',
    'Generando scoring',
    'Generando filtros',
  ]
  return names.map((name, i) => ({
    step: (i + 1) as 1 | 2 | 3 | 4 | 5,
    name,
    label: labels[i]!,
    status: 'pending' as const,
    ...overrides[i + 1],
  }))
}

let mockWSResult: {
  steps: ProcessingStep[]
  status: ProcessingStatus
  briefDraft: BriefDraft | null
  errorCode: string | null
  errorMessage: string | null
  retryable: boolean
  subscribed: boolean
}

vi.mock('../hooks/useBriefBuilderWS', () => ({
  useBriefBuilderWS: () => mockWSResult,
}))

function renderP2() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <P2Progress />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useBriefBuilderStore.setState({
    currentPhase: 2,
    processingToken: 'tok-abc',
    briefDraft: null,
    formInput: {
      websiteUrl: 'https://marz.com',
      descriptionText: '',
      pdfMeta: null,
    },
    pdfFile: null,
    campaignId: null,
  })
  mockMutate.mockClear()
  mockIsPending = false
  mockMutateError = null
  mockWSResult = {
    steps: buildSteps({ 1: { status: 'active' } }),
    status: 'pending',
    briefDraft: null,
    errorCode: null,
    errorMessage: null,
    retryable: false,
    subscribed: false,
  }
})

describe('P2Progress', () => {
  it('renders 5 processing steps', () => {
    renderP2()
    expect(screen.getByText('Leyendo sitio web')).toBeInTheDocument()
    expect(screen.getByText('Procesando descripción')).toBeInTheDocument()
    expect(screen.getByText('Generando ICP')).toBeInTheDocument()
    expect(screen.getByText('Generando scoring')).toBeInTheDocument()
    expect(screen.getByText('Generando filtros')).toBeInTheDocument()
  })

  it('updates step statuses from WS events', () => {
    mockWSResult = {
      ...mockWSResult,
      steps: buildSteps({
        1: { status: 'completed' },
        2: { status: 'active' },
      }),
    }
    renderP2()
    expect(screen.getByText('Leyendo sitio web')).toBeInTheDocument()
    expect(screen.getByText('Procesando descripción')).toBeInTheDocument()
  })

  it('navigates to phase 3 and stores briefDraft on completed', () => {
    mockWSResult = {
      ...mockWSResult,
      status: 'completed',
      briefDraft: MOCK_DRAFT,
      steps: buildSteps({
        1: { status: 'completed' },
        2: { status: 'completed' },
        3: { status: 'completed' },
        4: { status: 'completed' },
        5: { status: 'completed' },
      }),
    }
    renderP2()
    const state = useBriefBuilderStore.getState()
    expect(state.briefDraft).toEqual(MOCK_DRAFT)
    expect(state.currentPhase).toBe(3)
  })

  it('navigates to phase 3 on partial status', () => {
    mockWSResult = {
      ...mockWSResult,
      status: 'partial',
      briefDraft: MOCK_DRAFT,
      steps: buildSteps({
        1: { status: 'completed' },
        2: { status: 'completed' },
        3: { status: 'completed' },
        4: { status: 'failed' },
        5: { status: 'completed' },
      }),
    }
    renderP2()
    const state = useBriefBuilderStore.getState()
    expect(state.briefDraft).toEqual(MOCK_DRAFT)
    expect(state.currentPhase).toBe(3)
  })

  it('shows error screen on failed status', () => {
    mockWSResult = {
      ...mockWSResult,
      status: 'failed',
      errorMessage: 'No se pudo acceder al sitio web',
      retryable: true,
    }
    renderP2()
    expect(screen.getByText('Error en el análisis')).toBeInTheDocument()
    expect(
      screen.getByText('No se pudo acceder al sitio web'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeEnabled()
    expect(
      screen.getByRole('button', { name: /volver al formulario/i }),
    ).toBeInTheDocument()
  })

  it('disables retry button when retryable is false', () => {
    mockWSResult = {
      ...mockWSResult,
      status: 'failed',
      errorMessage: 'Error fatal',
      retryable: false,
    }
    renderP2()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeDisabled()
  })

  it('calls useProcessBrief.mutate on retry click', async () => {
    const user = userEvent.setup()
    mockWSResult = {
      ...mockWSResult,
      status: 'failed',
      errorMessage: 'Timeout',
      retryable: true,
    }
    renderP2()
    await user.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(mockMutate).toHaveBeenCalledWith('tok-abc', undefined)
  })

  it('navigates back to phase 1 on "Volver" click', async () => {
    const user = userEvent.setup()
    mockWSResult = {
      ...mockWSResult,
      status: 'failed',
      errorMessage: 'Error',
      retryable: false,
    }
    renderP2()
    await user.click(
      screen.getByRole('button', { name: /volver al formulario/i }),
    )
    expect(useBriefBuilderStore.getState().currentPhase).toBe(1)
  })

  it('preserves form data when going back to phase 1', async () => {
    const user = userEvent.setup()
    mockWSResult = {
      ...mockWSResult,
      status: 'failed',
      errorMessage: 'Error',
      retryable: false,
    }
    renderP2()
    await user.click(
      screen.getByRole('button', { name: /volver al formulario/i }),
    )
    const state = useBriefBuilderStore.getState()
    expect(state.formInput.websiteUrl).toBe('https://marz.com')
    expect(state.currentPhase).toBe(1)
  })

  it('has aria-live region for step announcements', () => {
    renderP2()
    const liveRegion = document.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
  })

  it('has no accessibility violations in progress state', async () => {
    const { container } = renderP2()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('does not call processBrief.mutate while subscribed=false', () => {
    mockWSResult = { ...mockWSResult, subscribed: false }
    renderP2()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('calls processBrief.mutate exactly once when subscribed flips to true', async () => {
    mockWSResult = { ...mockWSResult, subscribed: true }
    const { rerender } = renderP2()
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1)
    })
    expect(mockMutate).toHaveBeenCalledWith('tok-abc', expect.any(Object))
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <P2Progress />
      </QueryClientProvider>,
    )
    expect(mockMutate).toHaveBeenCalledTimes(1)
  })

  it('shows reset error and clears store on 409 conflict from processBrief', async () => {
    mockWSResult = { ...mockWSResult, subscribed: true }
    mockMutateError = new ApiError(409, 'already_processing', 'conflict')
    renderP2()
    expect(await screen.findByText(/ya fue procesado/i)).toBeInTheDocument()
    expect(useBriefBuilderStore.getState().processingToken).toBeNull()
  })

  it('shows generic dispatch error on non-conflict failure from processBrief', async () => {
    mockWSResult = { ...mockWSResult, subscribed: true }
    mockMutateError = new ApiError(500, 'internal', 'boom')
    renderP2()
    expect(
      await screen.findByText(/no se pudo iniciar el análisis/i),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations in failed state', async () => {
    mockWSResult = {
      ...mockWSResult,
      status: 'failed',
      errorMessage: 'Error',
      retryable: true,
    }
    const { container } = renderP2()
    expect(await axe(container)).toHaveNoViolations()
  })
})
