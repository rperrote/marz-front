import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import type { PendingBonusCardBonus } from '../PendingBonusCard'
import { PendingBonusCard } from '../PendingBonusCard'
import type { PendingBonusCollection } from '../PendingBonusPanel'
import { PendingBonusPanel } from '../PendingBonusPanel'

const { mockUseCreatorEarningsQuery } = vi.hoisted(() => ({
  mockUseCreatorEarningsQuery: vi.fn(),
}))

vi.mock('../../hooks/useCreatorEarnings', () => ({
  useCreatorEarningsQuery: mockUseCreatorEarningsQuery,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ''),
        '',
      ),
    { __lingui: true },
  ),
}))

vi.mock('@lingui/react/macro', () => ({
  Trans: ({ children }: { children: ReactNode }) => children,
}))

const speedBonus: PendingBonusCardBonus = {
  id: 'bonus-1',
  type: 'speed',
  offer_id: 'offer-1',
  conversation_id: 'conversation-1',
  campaign_id: 'campaign-1',
  brand_workspace_id: 'brand-workspace-1',
  brand_name: 'Nike',
  brand_logo_url: null,
  campaign_name: 'Spring Drop',
  deliverable_id: 'deliverable-1',
  deliverable_label: 'Reel #2',
  bonus_pct: '20',
  estimated_bonus_amount: '200.00',
  window_hours: 24,
  starts_at: '2026-05-09T12:00:00.000Z',
  expires_at: '2026-05-10T12:00:00.000Z',
  seconds_remaining: 86_400,
  action: {
    label: 'Ver oferta',
    href: '/workspace/conversations/conversation-1?offerId=offer-1',
  },
}

const performanceBonus: PendingBonusCardBonus = {
  ...speedBonus,
  id: 'bonus-2',
  type: 'performance',
  brand_name: 'Glossier',
  campaign_name: 'Summer Launch',
  action: {
    label: 'Ver oferta',
    href: '/workspace/conversations/conversation-2?offerId=offer-2',
  },
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-05-09T12:00:00.000Z'))
  mockUseCreatorEarningsQuery.mockReturnValue({
    isFetching: false,
    data: undefined,
  })
})

afterEach(() => {
  vi.useRealTimers()
  mockUseCreatorEarningsQuery.mockReset()
})

describe('PendingBonusCard', () => {
  it('renders a speed bonus with countdown and exact offer CTA href', () => {
    render(<PendingBonusCard bonus={speedBonus} />)

    expect(screen.getByText('Nike · Spring Drop · Reel #2')).toBeInTheDocument()
    expect(screen.getByText('+$200')).toBeInTheDocument()
    expect(screen.getByText('1d 00h')).toBeInTheDocument()

    const offerLink = screen.getByRole('link', { name: /ver oferta/i })
    expect(offerLink).toHaveAttribute(
      'href',
      '/workspace/conversations/conversation-1?offerId=offer-1',
    )
  })

  it('updates the countdown every second without removing tabular digits', () => {
    render(<PendingBonusCard bonus={{ ...speedBonus, seconds_remaining: 3 }} />)

    expect(screen.getByLabelText('Time remaining 00h 00m 03s')).toHaveClass(
      'tabular-nums',
    )

    act(() => vi.advanceTimersByTime(1000))

    expect(screen.getByText('00h 00m 02s')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    vi.useRealTimers()
    const { container } = render(<PendingBonusCard bonus={speedBonus} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('PendingBonusPanel', () => {
  it('renders only speed bonuses defensively', () => {
    render(
      <PendingBonusPanel
        period="30d"
        pendingBonuses={makePendingBonuses([speedBonus, performanceBonus])}
      />,
    )

    expect(screen.getByText(/Nike/)).toBeInTheDocument()
    expect(screen.queryByText(/Glossier/)).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no pending speed bonuses', () => {
    render(
      <PendingBonusPanel
        period="30d"
        pendingBonuses={makePendingBonuses([])}
      />,
    )

    expect(
      screen.getByText('No tenés bonos pendientes por ahora.'),
    ).toBeInTheDocument()
  })

  it('exposes keyset pagination through the next cursor', () => {
    render(
      <PendingBonusPanel
        period="30d"
        pendingBonuses={makePendingBonuses([speedBonus], {
          has_more: true,
          next_cursor: 'cursor-2',
        })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }))

    expect(mockUseCreatorEarningsQuery).toHaveBeenLastCalledWith({
      period: '30d',
      cursor: 'cursor-2',
      limit: 25,
    })
  })
})

function makePendingBonuses(
  items: PendingBonusCardBonus[],
  overrides?: Partial<PendingBonusCollection>,
): PendingBonusCollection {
  return {
    items,
    next_cursor: null,
    has_more: false,
    ...overrides,
  }
}
