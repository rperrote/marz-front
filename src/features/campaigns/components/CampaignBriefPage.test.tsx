import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CampaignBriefPage } from './CampaignBriefPage'
import { ApiError } from '#/shared/api/mutator'
import type { BriefDraft } from '../brief-builder/store'
import type { CampaignBriefResponse } from '../hooks/useCampaignBrief'

const mockCustomFetch = vi.fn()

vi.mock('#/shared/api/mutator', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    customFetch: (...args: unknown[]) => mockCustomFetch(...args),
  }
})

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode
    to: string
    [key: string]: unknown
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

function makeDraft(): BriefDraft {
  return {
    campaign: {
      name: 'Test Campaign',
      objective: 'brand_awareness',
      budget_amount: 5000,
      budget_currency: 'USD',
      deadline: '2026-06-01',
    },
    brief: {
      icp_description: 'Creadores fitness LatAm',
      icp_age_min: 18,
      icp_age_max: 35,
      icp_genders: ['male', 'female'],
      icp_countries: ['AR', 'MX'],
      icp_platforms: ['instagram', 'tiktok'],
      icp_interests: ['fitness', 'nutrición'],
      scoring_dimensions: [
        {
          id: 'dim-1',
          name: 'Engagement',
          description: 'Engagement rate alto',
          weight_pct: 60,
          positive_signals: [],
          negative_signals: [],
        },
      ],
      hard_filters: [
        { id: 'hf-1', filter_type: 'min_followers', filter_value: '10000' },
      ],
      disqualifiers: ['Contenido político'],
    },
  }
}

function makeBriefResponse(
  overrides?: Partial<CampaignBriefResponse>,
): CampaignBriefResponse {
  return {
    campaign_id: 'campaign-123',
    campaign_name: 'Mi Campaña',
    draft: makeDraft(),
    ...overrides,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

beforeEach(() => {
  mockCustomFetch.mockReset()
})

describe('CampaignBriefPage', () => {
  it('shows loading skeleton while fetching', () => {
    mockCustomFetch.mockReturnValue(new Promise(() => {}))
    render(<CampaignBriefPage campaignId="campaign-123" />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Resumen del brief')).toBeInTheDocument()
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders brief summary on success', async () => {
    mockCustomFetch.mockResolvedValue({ data: makeBriefResponse() })

    render(<CampaignBriefPage campaignId="campaign-123" />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(
        screen.getByText('Resumen del brief — Mi Campaña'),
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Campaña')).toBeInTheDocument()
    expect(screen.getByText('Test Campaign')).toBeInTheDocument()
    expect(screen.getByText('ICP')).toBeInTheDocument()
    expect(screen.getByText('Creadores fitness LatAm')).toBeInTheDocument()
    expect(screen.getByText('Scoring Dimensions')).toBeInTheDocument()
  })

  it('shows not-found message on 404', async () => {
    mockCustomFetch.mockRejectedValue(
      new ApiError(404, 'not_found', 'Campaign not found'),
    )

    render(<CampaignBriefPage campaignId="nonexistent" />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(
        screen.getByText('No se encontró el brief de esta campaña.'),
      ).toBeInTheDocument()
    })

    const backLinks = screen.getAllByText('Volver a campañas')
    expect(backLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('has no accessibility violations on success', async () => {
    mockCustomFetch.mockResolvedValue({ data: makeBriefResponse() })

    const { container } = render(
      <CampaignBriefPage campaignId="campaign-123" />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(
        screen.getByText('Resumen del brief — Mi Campaña'),
      ).toBeInTheDocument()
    })

    expect(await axe(container)).toHaveNoViolations()
  })
})
