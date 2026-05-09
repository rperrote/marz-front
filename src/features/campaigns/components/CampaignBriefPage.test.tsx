import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CampaignBriefPage } from './CampaignBriefPage'
import { ApiError } from '#/shared/api/mutator'
import type { CampaignBriefResponse } from '#/shared/api/generated/model'

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

function makeBriefResponse(
  overrides?: Partial<CampaignBriefResponse>,
): CampaignBriefResponse {
  return {
    campaign_id: 'campaign-123',
    brief_source_url: 'https://example.com',
    icp_description: 'Creadores fitness LatAm',
    icp_age_min: 18,
    icp_age_max: 35,
    icp_genders: ['male', 'female'],
    icp_countries: ['AR', 'MX'],
    icp_platforms: ['instagram', 'tiktok'],
    icp_interests: ['fitness', 'nutrición'],
    scoring_dimensions: [{ name: 'Engagement', weight_pct: 60 }],
    hard_filters: [{ field: 'min_followers', operator: 'eq', value: '10000' }],
    disqualifiers: ['Contenido político'],
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

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders brief summary on success', async () => {
    mockCustomFetch.mockResolvedValue({ data: makeBriefResponse() })

    render(<CampaignBriefPage campaignId="campaign-123" />, {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(screen.getByText('ICP')).toBeInTheDocument()
    })

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
      expect(screen.getByText('ICP')).toBeInTheDocument()
    })

    expect(await axe(container)).toHaveNoViolations()
  })
})
