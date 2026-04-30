import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { MultiStageStagesList } from './MultiStageStagesList'
import type { OfferStageDTO } from '../hooks/useConversationOffers'
import { trackOfferEvent } from '../analytics'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('../analytics', () => ({
  trackOfferEvent: vi.fn(),
}))

const mockTrackOfferEvent = vi.mocked(trackOfferEvent)

const stages: OfferStageDTO[] = [
  {
    name: 'Concept',
    description: 'Create mood board and concept.',
    deadline: '2024-05-01',
    amount: '1500.00',
    status: 'locked',
  },
  {
    name: 'Production',
    description: 'Film and edit the video.',
    deadline: '2024-06-01',
    amount: '4500.00',
    status: 'open',
  },
  {
    name: 'Delivery',
    description: 'Final delivery and revisions.',
    deadline: '2024-07-01',
    amount: '2000.00',
    status: 'approved',
  },
]

function getToggle(name: string) {
  return screen.getByRole('button', {
    name: new RegExp(`toggle stage ${name}`, 'i'),
  })
}

describe('MultiStageStagesList', () => {
  it('firstStageExpandedByDefault_whenSent', () => {
    render(
      <MultiStageStagesList
        stages={stages}
        offerStatus="sent"
        currency="USD"
        actorKind="brand"
      />,
    )

    expect(
      screen.getByText('Create mood board and concept.'),
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Film and edit the video.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Final delivery and revisions.'),
    ).not.toBeInTheDocument()
  })

  it('firstOpenStageExpandedByDefault_whenAccepted', () => {
    render(
      <MultiStageStagesList
        stages={stages}
        offerStatus="accepted"
        currency="USD"
        actorKind="brand"
      />,
    )

    expect(screen.getByText('Film and edit the video.')).toBeInTheDocument()

    expect(
      screen.queryByText('Create mood board and concept.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Final delivery and revisions.'),
    ).not.toBeInTheDocument()
  })

  it('collapsedShowsTitleDeadlineStatus', () => {
    render(
      <MultiStageStagesList
        stages={stages}
        offerStatus="sent"
        currency="USD"
        actorKind="brand"
      />,
    )

    expect(screen.getByText('Concept')).toBeInTheDocument()
    expect(screen.getByText('Production')).toBeInTheDocument()
    expect(screen.getByText('Delivery')).toBeInTheDocument()

    expect(screen.getByText('May 1')).toBeInTheDocument()
    expect(screen.getByText('Jun 1')).toBeInTheDocument()
    expect(screen.getByText('Jul 1')).toBeInTheDocument()

    expect(screen.getByText('Locked')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('expandedShowsAllFields', async () => {
    const user = userEvent.setup()
    render(
      <MultiStageStagesList
        stages={stages}
        offerStatus="sent"
        currency="USD"
        actorKind="brand"
      />,
    )

    const productionToggle = getToggle('production')
    await user.click(productionToggle)
    expect(mockTrackOfferEvent).toHaveBeenCalledWith('stage_expanded', {
      actor_kind: 'brand',
      offer_type: 'multistage',
      stage_index: 1,
      surface: 'panel',
    })

    expect(screen.getByText('Film and edit the video.')).toBeInTheDocument()
    expect(screen.getByText('$4,500.00')).toBeInTheDocument()
  })

  it('togglesEachStageIndependently', async () => {
    const user = userEvent.setup()
    render(
      <MultiStageStagesList
        stages={stages}
        offerStatus="sent"
        currency="USD"
        actorKind="brand"
      />,
    )

    const conceptToggle = getToggle('concept')
    const productionToggle = getToggle('production')

    expect(
      screen.getByText('Create mood board and concept.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Film and edit the video.'),
    ).not.toBeInTheDocument()

    await user.click(productionToggle)
    expect(screen.getByText('Film and edit the video.')).toBeInTheDocument()
    expect(
      screen.getByText('Create mood board and concept.'),
    ).toBeInTheDocument()

    await user.click(conceptToggle)
    expect(
      screen.queryByText('Create mood board and concept.'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Film and edit the video.')).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <MultiStageStagesList
        stages={stages}
        offerStatus="sent"
        currency="USD"
        actorKind="brand"
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
