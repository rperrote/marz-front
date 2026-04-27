import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

import type { OfferTimelineMessage } from './OfferTimelineEntry'
import { OfferTimelineEntry } from './OfferTimelineEntry'

vi.mock('./OfferCardSent', () => ({
  OfferCardSent: (props: Record<string, unknown>) => (
    <div data-testid="offer-card-sent" data-status={props.status} />
  ),
}))
vi.mock('./OfferCardReceived', () => ({
  OfferCardReceived: (props: Record<string, unknown>) => (
    <div data-testid="offer-card-received" data-status={props.status} />
  ),
}))
vi.mock('./OfferAcceptedCardIn', () => ({
  OfferAcceptedCardIn: () => <div data-testid="offer-accepted-card-in" />,
}))
vi.mock('./OfferAcceptedCardOut', () => ({
  OfferAcceptedCardOut: () => <div data-testid="offer-accepted-card-out" />,
}))
vi.mock('./OfferRejectedBubble', () => ({
  OfferRejectedBubble: (props: Record<string, unknown>) => (
    <div data-testid="offer-rejected-bubble" data-side={props.viewerSide} />
  ),
}))
vi.mock('./OfferExpiredBubble', () => ({
  OfferExpiredBubble: (props: Record<string, unknown>) => (
    <div data-testid="offer-expired-bubble" data-side={props.viewerSide} />
  ),
}))

const VALID_SNAPSHOT = {
  offer_id: 'off-1',
  campaign_id: 'camp-1',
  campaign_name: 'Test Campaign',
  type: 'single' as const,
  platform: 'instagram',
  format: 'reel',
  total_amount: '500.00',
  currency: 'USD',
  deadline: '2026-05-01T00:00:00Z',
  speed_bonus: null,
  sent_at: '2026-04-01T00:00:00Z',
  expires_at: '2026-04-08T00:00:00Z',
}

function makeMessage(
  overrides: Partial<OfferTimelineMessage> = {},
): OfferTimelineMessage {
  return {
    id: 'msg-1',
    author_account_id: 'acc-brand',
    event_type: 'offer_sent',
    payload: { snapshot: VALID_SNAPSHOT },
    ...overrides,
  }
}

const CURRENT_ACCOUNT = 'acc-brand'

describe('OfferTimelineEntry', () => {
  it('renders OfferCardSent for offer_sent when viewer is actor', () => {
    const { getByTestId } = render(
      <OfferTimelineEntry
        message={makeMessage()}
        currentAccountId={CURRENT_ACCOUNT}
        counterpartDisplayName="Creator Name"
      />,
    )
    expect(getByTestId('offer-card-sent')).toBeDefined()
  })

  it('renders OfferCardReceived for offer_sent when viewer is recipient', () => {
    const { getByTestId } = render(
      <OfferTimelineEntry
        message={makeMessage()}
        currentAccountId="acc-other"
        counterpartDisplayName="Brand Name"
      />,
    )
    expect(getByTestId('offer-card-received')).toBeDefined()
  })

  it('renders OfferAcceptedCardIn for offer_accepted when viewer is actor', () => {
    const { getByTestId } = render(
      <OfferTimelineEntry
        message={makeMessage({
          event_type: 'offer_accepted',
          payload: {
            snapshot: {
              ...VALID_SNAPSHOT,
              accepted_at: '2026-04-02T00:00:00Z',
            },
          },
        })}
        currentAccountId={CURRENT_ACCOUNT}
        counterpartDisplayName="Creator Name"
      />,
    )
    expect(getByTestId('offer-accepted-card-in')).toBeDefined()
  })

  it('renders OfferAcceptedCardOut for offer_accepted when viewer is recipient', () => {
    const { getByTestId } = render(
      <OfferTimelineEntry
        message={makeMessage({
          event_type: 'offer_accepted',
          payload: {
            snapshot: {
              ...VALID_SNAPSHOT,
              accepted_at: '2026-04-02T00:00:00Z',
            },
          },
        })}
        currentAccountId="acc-other"
        counterpartDisplayName="Brand Name"
      />,
    )
    expect(getByTestId('offer-accepted-card-out')).toBeDefined()
  })

  it('renders OfferRejectedBubble for offer_rejected', () => {
    const { getByTestId } = render(
      <OfferTimelineEntry
        message={makeMessage({ event_type: 'offer_rejected' })}
        currentAccountId={CURRENT_ACCOUNT}
        counterpartDisplayName="Creator Name"
      />,
    )
    expect(getByTestId('offer-rejected-bubble')).toBeDefined()
  })

  it('renders OfferExpiredBubble for offer_expired', () => {
    const { getByTestId } = render(
      <OfferTimelineEntry
        message={makeMessage({ event_type: 'offer_expired' })}
        currentAccountId={CURRENT_ACCOUNT}
        counterpartDisplayName="Creator Name"
      />,
    )
    expect(getByTestId('offer-expired-bubble')).toBeDefined()
  })

  it('returns null for unknown event_type', () => {
    const { container } = render(
      <OfferTimelineEntry
        message={makeMessage({ event_type: 'unknown_event' })}
        currentAccountId={CURRENT_ACCOUNT}
        counterpartDisplayName="Creator Name"
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null for null event_type', () => {
    const { container } = render(
      <OfferTimelineEntry
        message={makeMessage({ event_type: null })}
        currentAccountId={CURRENT_ACCOUNT}
        counterpartDisplayName="Creator Name"
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when snapshot fails Zod validation', () => {
    const { container } = render(
      <OfferTimelineEntry
        message={makeMessage({
          event_type: 'offer_sent',
          payload: { snapshot: { invalid: true } },
        })}
        currentAccountId={CURRENT_ACCOUNT}
        counterpartDisplayName="Creator Name"
      />,
    )
    expect(container.innerHTML).toBe('')
  })
})
