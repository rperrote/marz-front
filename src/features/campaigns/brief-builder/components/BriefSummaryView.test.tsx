import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { BriefSummaryView } from './BriefSummaryView'
import type { BriefDraft } from '../store'

function makeDraft(overrides?: Partial<BriefDraft>): BriefDraft {
  return {
    campaign: {
      name: 'Mi campaña test',
      objective: 'brand_awareness',
      budget_amount: 5000,
      budget_currency: 'USD',
      deadline: '2026-06-01',
      ...overrides?.campaign,
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
        {
          id: 'dim-2',
          name: 'Reach',
          description: 'Alcance orgánico',
          weight_pct: 40,
          positive_signals: [],
          negative_signals: [],
        },
      ],
      hard_filters: [
        { id: 'hf-1', filter_type: 'min_followers', filter_value: '10000' },
      ],
      disqualifiers: ['Contenido político', 'Gambling'],
      ...overrides?.brief,
    },
  }
}

describe('BriefSummaryView', () => {
  it('renders all sections with full data', () => {
    render(<BriefSummaryView draft={makeDraft()} />)

    expect(screen.getByText('Campaña')).toBeInTheDocument()
    expect(screen.getByText('Mi campaña test')).toBeInTheDocument()
    expect(screen.getByText('Brand Awareness')).toBeInTheDocument()
    expect(screen.getByText('USD 5000')).toBeInTheDocument()
    expect(screen.getByText('2026-06-01')).toBeInTheDocument()

    expect(screen.getByText('ICP')).toBeInTheDocument()
    expect(screen.getByText('Creadores fitness LatAm')).toBeInTheDocument()
    expect(screen.getByText('18 – 35')).toBeInTheDocument()
    expect(screen.getByText('Masculino, Femenino')).toBeInTheDocument()
    expect(screen.getByText('AR, MX')).toBeInTheDocument()
    expect(screen.getByText('Instagram, TikTok')).toBeInTheDocument()
    expect(screen.getByText('fitness, nutrición')).toBeInTheDocument()

    expect(screen.getByText('Scoring Dimensions')).toBeInTheDocument()
    expect(screen.getByText('60% — Engagement rate alto')).toBeInTheDocument()
    expect(screen.getByText('40% — Alcance orgánico')).toBeInTheDocument()

    expect(screen.getByText('Hard Filters')).toBeInTheDocument()
    expect(screen.getByText('10000')).toBeInTheDocument()

    expect(screen.getByText('Disqualifiers')).toBeInTheDocument()
    expect(screen.getByText('Contenido político')).toBeInTheDocument()
    expect(screen.getByText('Gambling')).toBeInTheDocument()
  })

  it('hides empty sections', () => {
    render(
      <BriefSummaryView
        draft={makeDraft({
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
        })}
      />,
    )

    expect(screen.getByText('Solo nombre')).toBeInTheDocument()
    expect(screen.getByText('Campaña')).toBeInTheDocument()
    expect(screen.queryByText('ICP')).not.toBeInTheDocument()
    expect(screen.queryByText('Scoring Dimensions')).not.toBeInTheDocument()
    expect(screen.queryByText('Hard Filters')).not.toBeInTheDocument()
    expect(screen.queryByText('Disqualifiers')).not.toBeInTheDocument()
  })

  it('shows fallback when all data is empty', () => {
    render(
      <BriefSummaryView
        draft={{
          campaign: {
            name: '',
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
        }}
      />,
    )
    expect(screen.getByText(/no hay datos disponibles/i)).toBeInTheDocument()
  })

  it('renders scoring dimension description fallback as dash', () => {
    render(
      <BriefSummaryView
        draft={makeDraft({
          brief: {
            icp_description: null,
            icp_age_min: null,
            icp_age_max: null,
            icp_genders: [],
            icp_countries: [],
            icp_platforms: [],
            icp_interests: [],
            scoring_dimensions: [
              {
                id: 'dim-1',
                name: 'Engagement',
                description: '',
                weight_pct: 100,
                positive_signals: [],
                negative_signals: [],
              },
            ],
            hard_filters: [],
            disqualifiers: [],
          },
        })}
      />,
    )
    expect(screen.getByText('100% — —')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<BriefSummaryView draft={makeDraft()} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
