import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { P3Review } from './P3Review'
import { useBriefBuilderStore } from '../store'
import type { BriefDraft } from '../store'
import { renderWithValidation } from '../test-utils'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

let dimIdCounter = 0
function dimId() {
  return `dim-${String(++dimIdCounter)}`
}

function makeDraft(overrides?: Partial<BriefDraft>): BriefDraft {
  return {
    campaign: {
      name: 'Campaña test',
      objective: 'brand_awareness',
      budget_amount: 3000,
      budget_currency: 'USD',
      deadline: '',
      ...overrides?.campaign,
    },
    brief: {
      icp_description: 'Fitness creators',
      icp_age_min: 18,
      icp_age_max: 35,
      icp_genders: ['male'],
      icp_countries: ['AR'],
      icp_platforms: ['instagram'],
      icp_interests: ['fitness'],
      scoring_dimensions: [
        {
          id: dimId(),
          name: 'Engagement',
          description: 'Rate',
          weight_pct: 60,
          positive_signals: [],
          negative_signals: [],
        },
        {
          id: dimId(),
          name: 'Reach',
          description: 'Followers',
          weight_pct: 40,
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

describe('P3Review', () => {
  it('renders campaign fields pre-filled from store', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    renderWithValidation(<P3Review />)
    expect(screen.getAllByLabelText(/^nombre$/i)[0]!).toHaveValue(
      'Campaña test',
    )
  })

  it('shows weight sum indicator in real time', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    renderWithValidation(<P3Review />)
    expect(screen.getByText('Total 100 / 100')).toBeInTheDocument()
  })

  it('updates weight sum when slider changes via dimension card', async () => {
    const user = userEvent.setup()
    useBriefBuilderStore.setState({
      briefDraft: makeDraft({
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
              id: dimId(),
              name: 'A',
              description: '',
              weight_pct: 50,
              positive_signals: [],
              negative_signals: [],
            },
            {
              id: dimId(),
              name: 'B',
              description: '',
              weight_pct: 30,
              positive_signals: [],
              negative_signals: [],
            },
          ],
          hard_filters: [],
          disqualifiers: [],
        },
      }),
    })
    renderWithValidation(<P3Review />)
    expect(screen.getByText('Total 80 / 100')).toBeInTheDocument()

    const removeButtons = screen.getAllByRole('button', {
      name: /eliminar dimensión/i,
    })
    await user.click(removeButtons[1]!)
    expect(screen.getByText('Total 50 / 100')).toBeInTheDocument()
  })

  it('disables add dimension when there are 4 dimensions', () => {
    useBriefBuilderStore.setState({
      briefDraft: makeDraft({
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
              id: dimId(),
              name: 'A',
              description: '',
              weight_pct: 25,
              positive_signals: [],
              negative_signals: [],
            },
            {
              id: dimId(),
              name: 'B',
              description: '',
              weight_pct: 25,
              positive_signals: [],
              negative_signals: [],
            },
            {
              id: dimId(),
              name: 'C',
              description: '',
              weight_pct: 25,
              positive_signals: [],
              negative_signals: [],
            },
            {
              id: dimId(),
              name: 'D',
              description: '',
              weight_pct: 25,
              positive_signals: [],
              negative_signals: [],
            },
          ],
          hard_filters: [],
          disqualifiers: [],
        },
      }),
    })
    renderWithValidation(<P3Review />)
    const addBtn = screen.getByRole('button', { name: /agregar dimensión/i })
    expect(addBtn).toBeDisabled()
  })

  it('shows insufficient banner when draft is empty', () => {
    useBriefBuilderStore.setState({ briefDraft: null })
    renderWithValidation(<P3Review />)
    expect(
      screen.getByText(/no fue suficiente para generar el brief/i),
    ).toBeInTheDocument()
  })

  it('preserves data when going back and re-entering', () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    const { unmount } = renderWithValidation(<P3Review />)
    expect(screen.getAllByLabelText(/^nombre$/i)[0]!).toHaveValue(
      'Campaña test',
    )

    unmount()

    const stored = useBriefBuilderStore.getState().briefDraft
    expect(stored?.campaign.name).toBe('Campaña test')
    expect(stored?.brief.scoring_dimensions).toHaveLength(2)

    renderWithValidation(<P3Review />)
    expect(screen.getAllByLabelText(/^nombre$/i)[0]!).toHaveValue(
      'Campaña test',
    )
  })

  it('can add a new dimension', async () => {
    const user = userEvent.setup()
    useBriefBuilderStore.setState({
      briefDraft: makeDraft({
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
              id: dimId(),
              name: 'A',
              description: '',
              weight_pct: 50,
              positive_signals: [],
              negative_signals: [],
            },
          ],
          hard_filters: [],
          disqualifiers: [],
        },
      }),
    })
    renderWithValidation(<P3Review />)

    const addBtn = screen.getByRole('button', { name: /agregar dimensión/i })
    await user.click(addBtn)

    const cards = screen.getAllByText(/^Dimensión \d+$/)
    expect(cards).toHaveLength(2)
  })

  it('toggles gender chips', async () => {
    const user = userEvent.setup()
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    renderWithValidation(<P3Review />)

    const femeninoChip = screen.getByRole('checkbox', { name: 'Femenino' })
    expect(femeninoChip).toHaveAttribute('aria-checked', 'false')
    await user.click(femeninoChip)
    expect(femeninoChip).toHaveAttribute('aria-checked', 'true')
  })

  it('has no accessibility violations', async () => {
    useBriefBuilderStore.setState({ briefDraft: makeDraft() })
    const { container } = renderWithValidation(<P3Review />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
