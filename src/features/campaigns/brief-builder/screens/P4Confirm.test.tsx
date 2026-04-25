import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { P4Confirm } from './P4Confirm'
import { useBriefBuilderStore } from '../store'
import type { BriefDraft } from '../store'

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
          id: 'test-dim-1',
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

beforeEach(() => {
  useBriefBuilderStore.getState().reset()
})

describe('P4Confirm', () => {
  it('shows fallback when no draft exists', () => {
    render(<P4Confirm />)
    expect(screen.getByText(/sin brief disponible/i)).toBeInTheDocument()
  })

  it('renders summary with draft data', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    render(<P4Confirm />)
    expect(screen.getByText('Mi campaña')).toBeInTheDocument()
    expect(screen.getByText('Brand Awareness')).toBeInTheDocument()
    expect(screen.getByText('USD 5000')).toBeInTheDocument()
    expect(screen.getByText('Creadores fitness')).toBeInTheDocument()
  })

  it('omits empty fields from summary', () => {
    useBriefBuilderStore.setState({
      briefDraft: makeDraft({
        campaign: {
          name: 'Solo nombre',
          objective: '',
          budget_amount: null,
          budget_currency: 'USD',
          deadline: '',
        },
        brief: {
          icp_description: null,
          icp_age_min: null,
          icp_age_max: null,
          icp_genders: [],
          icp_countries: [],
          icp_platforms: [],
          icp_interests: [],
          scoring_dimensions: [],
          hard_filters: [],
          disqualifiers: [],
        },
      }),
    })
    render(<P4Confirm />)
    expect(screen.getByText('Solo nombre')).toBeInTheDocument()
    expect(screen.queryByText('Objetivo')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    const { container } = render(<P4Confirm />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
