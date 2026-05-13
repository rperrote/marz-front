import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { createElement } from 'react'

import { CampaignFilterSelect } from './CampaignFilterSelect'
import * as activeCampaignsModule from '#/shared/api/activeCampaigns'

type ActiveCampaignsResult = ReturnType<
  typeof activeCampaignsModule.useActiveCampaigns
>

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => () => Promise.resolve(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

vi.mock('./analytics', () => ({
  trackConversationCampaignFilterChanged: vi.fn(),
}))

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function activeCampaignsResult(
  result: Pick<ActiveCampaignsResult, 'data' | 'isLoading'>,
): ActiveCampaignsResult {
  return result as ActiveCampaignsResult
}

describe('CampaignFilterSelect', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when no campaigns are active', () => {
    vi.spyOn(activeCampaignsModule, 'useActiveCampaigns').mockReturnValue(
      activeCampaignsResult({
        data: [],
        isLoading: false,
      }),
    )

    const { container } = render(<CampaignFilterSelect />, {
      wrapper: wrapper(),
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while loading', () => {
    vi.spyOn(activeCampaignsModule, 'useActiveCampaigns').mockReturnValue(
      activeCampaignsResult({
        data: undefined,
        isLoading: true,
      }),
    )

    const { container } = render(<CampaignFilterSelect />, {
      wrapper: wrapper(),
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders trigger with campaigns aria-label', () => {
    vi.spyOn(activeCampaignsModule, 'useActiveCampaigns').mockReturnValue(
      activeCampaignsResult({
        data: [
          {
            id: 'cmp-1',
            name: 'Spring 2026',
            status: 'active',
            budget_currency: 'USD',
            budget_remaining: '500.00',
          },
        ],
        isLoading: false,
      }),
    )

    render(<CampaignFilterSelect />, { wrapper: wrapper() })
    expect(screen.getByLabelText(/filtrar por campaña/i)).toBeInTheDocument()
  })
})
