import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { OfferCardMultiStage } from './OfferCardMultiStage'
import type { OfferSnapshotMultiStage, OfferStatus } from '../types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('#/shared/hooks/useNow', () => ({
  useNow: () => new Date('2026-04-26T12:00:00Z'),
}))

const baseSnapshot: OfferSnapshotMultiStage = {
  offer_id: 'offer-ms-1',
  campaign_id: 'camp-1',
  campaign_name: 'Q4 Echo Wireless Series',
  type: 'multistage',
  total_amount: '6000.00',
  currency: 'USD',
  deadline: '2026-10-12',
  sent_at: '2026-04-25T10:00:00Z',
  expires_at: '2026-04-28T10:00:00Z',
  stages: [
    {
      name: 'Stage 1: Concept',
      description:
        'Create the initial concept and mood board for the campaign. This includes research, brainstorming, and presenting three distinct creative directions.',
      deadline: '2026-05-01',
      amount: '1500.00',
    },
    {
      name: 'Stage 2: Production',
      description: 'Film and edit the deliverables.',
      deadline: '2026-06-01',
      amount: '4500.00',
    },
  ],
}

const expiredSnapshot: OfferSnapshotMultiStage = {
  ...baseSnapshot,
  expires_at: '2026-04-25T10:00:00Z',
}

const statuses: OfferStatus[] = ['sent', 'accepted', 'rejected', 'expired']

describe('OfferCardMultiStage', () => {
  const onAccept = vi.fn()
  const onReject = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(statuses)(
    'rendersAllFourStatuses_outAndIn for status "%s"',
    (status) => {
      const { rerender } = render(
        <OfferCardMultiStage
          snapshot={baseSnapshot}
          status={status}
          side="out"
          onAccept={onAccept}
          onReject={onReject}
        />,
      )
      expect(screen.getByText('Q4 Echo Wireless Series')).toBeInTheDocument()
      expect(screen.getAllByText('$6,000.00').length).toBeGreaterThanOrEqual(1)

      rerender(
        <OfferCardMultiStage
          snapshot={baseSnapshot}
          status={status}
          side="in"
          onAccept={onAccept}
          onReject={onReject}
        />,
      )
      expect(screen.getByText('Q4 Echo Wireless Series')).toBeInTheDocument()
      expect(screen.getAllByText('$6,000.00').length).toBeGreaterThanOrEqual(1)
    },
  )

  it('actionsDisabledWhenExpired', () => {
    render(
      <OfferCardMultiStage
        snapshot={expiredSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(
      screen.queryByRole('button', { name: /accept offer/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /reject/i }),
    ).not.toBeInTheDocument()
  })

  it('expandsCollapsesEachStageIndependently', async () => {
    const user = userEvent.setup()
    render(
      <OfferCardMultiStage snapshot={baseSnapshot} status="sent" side="out" />,
    )

    const stage1Toggle = screen.getByRole('button', {
      name: /toggle stage stage 1: concept/i,
    })
    const stage2Toggle = screen.getByRole('button', {
      name: /toggle stage stage 2: production/i,
    })

    expect(stage1Toggle).toHaveAttribute('aria-expanded', 'false')
    expect(stage2Toggle).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByText(/create the initial concept/i),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/film and edit/i)).not.toBeInTheDocument()

    await user.click(stage1Toggle)
    expect(stage1Toggle).toHaveAttribute('aria-expanded', 'true')
    expect(stage2Toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText(/create the initial concept/i)).toBeInTheDocument()
    expect(screen.queryByText(/film and edit/i)).not.toBeInTheDocument()

    await user.click(stage2Toggle)
    expect(stage1Toggle).toHaveAttribute('aria-expanded', 'true')
    expect(stage2Toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/create the initial concept/i)).toBeInTheDocument()
    expect(screen.getByText(/film and edit/i)).toBeInTheDocument()

    await user.click(stage1Toggle)
    expect(stage1Toggle).toHaveAttribute('aria-expanded', 'false')
    expect(stage2Toggle).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.queryByText(/create the initial concept/i),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/film and edit/i)).toBeInTheDocument()
  })

  it('descriptionExpandable', async () => {
    const user = userEvent.setup()
    render(
      <OfferCardMultiStage snapshot={baseSnapshot} status="sent" side="out" />,
    )

    const stage1Toggle = screen.getByRole('button', {
      name: /toggle stage stage 1: concept/i,
    })
    await user.click(stage1Toggle)

    const descToggle = screen.getByRole('button', { name: /show more/i })
    expect(descToggle).toBeInTheDocument()
    expect(descToggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(descToggle)
    const showLess = screen.getByRole('button', { name: /show less/i })
    expect(showLess).toBeInTheDocument()
    expect(showLess).toHaveAttribute('aria-expanded', 'true')

    await user.click(showLess)
    const showMore = screen.getByRole('button', { name: /show more/i })
    expect(showMore).toBeInTheDocument()
    expect(showMore).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows accept/reject buttons when side is in, status sent and not expired', () => {
    render(
      <OfferCardMultiStage
        snapshot={baseSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(
      screen.getByRole('button', { name: /accept offer/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('hides actions when side is out', () => {
    render(
      <OfferCardMultiStage
        snapshot={baseSnapshot}
        status="sent"
        side="out"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(
      screen.queryByRole('button', { name: /accept offer/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onAccept and onReject', async () => {
    const user = userEvent.setup()
    render(
      <OfferCardMultiStage
        snapshot={baseSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    await user.click(screen.getByRole('button', { name: /accept offer/i }))
    expect(onAccept).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: /reject/i }))
    expect(onReject).toHaveBeenCalledOnce()
  })

  it('disables buttons while acting', () => {
    render(
      <OfferCardMultiStage
        snapshot={baseSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
        isAccepting
      />,
    )
    expect(screen.getByRole('button', { name: /accepting/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled()
  })

  it('has role="article" with descriptive aria-label', () => {
    render(
      <OfferCardMultiStage
        snapshot={baseSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('aria-label')
    expect(article.getAttribute('aria-label')).toContain('$6,000.00')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OfferCardMultiStage
        snapshot={baseSnapshot}
        status="sent"
        side="in"
        onAccept={onAccept}
        onReject={onReject}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
