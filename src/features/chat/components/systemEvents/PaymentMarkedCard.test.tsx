import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MessageItem } from '#/features/chat/types'

import { PaymentMarkedCard } from './PaymentMarkedCard'

const mockCustomFetch = vi.hoisted(() => vi.fn())

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

vi.mock('#/shared/api/mutator', () => ({
  customFetch: mockCustomFetch,
}))

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []
  callback: IntersectionObserverCallback
  observe = vi.fn()
  disconnect = vi.fn()

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeIntersectionObserver.instances.push(this)
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [
        {
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          target: document.createElement('div'),
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        },
      ],
      this as unknown as IntersectionObserver,
    )
  }
}

function makePaymentMarkedMessage(
  payloadOverrides: Record<string, unknown> = {},
): MessageItem {
  return {
    id: 'msg-payment-1',
    conversation_id: 'conv-1',
    author_account_id: 'system',
    type: 'system_event',
    text_content: null,
    event_type: 'PaymentMarked',
    payload: {
      snapshot: {
        event_type: 'PaymentMarked',
        declared_payment_id: 'pay-1',
        deliverable_id: 'del-1',
        amount: '4575.00',
        currency: 'USD',
        deliverable_display_label: 'YouTube Video',
        declared_at: '2026-05-08T12:00:00Z',
        ...payloadOverrides,
      },
    },
    created_at: '2026-05-08T12:00:00Z',
    read_by_self: false,
  }
}

describe('PaymentMarkedCard', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    FakeIntersectionObserver.instances = []
    mockCustomFetch.mockReset()
    mockCustomFetch.mockResolvedValue({ status: 202, data: undefined })
  })

  it('renders the outgoing sent variant for brand viewers', () => {
    const { container } = render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'brand' }}
      />,
    )

    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders the incoming received variant for creator viewers', () => {
    const { container } = render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'creator' }}
      />,
    )

    expect(container.firstChild).toMatchSnapshot()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'creator' }}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders from the self-contained snapshot without aggregate data', () => {
    const { getByText } = render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage({
          amount: '1200.50',
          currency: 'USD',
          deliverable_display_label: 'Instagram Reel',
          declared_at: '2026-05-09T12:00:00Z',
        })}
        viewer={{ kind: 'creator' }}
      />,
    )

    expect(getByText('Payment of $1,200.50 received')).toBeInTheDocument()
    expect(getByText(/^Instagram Reel · .*2026$/)).toBeInTheDocument()
  })

  it('tracks payment_card_seen exactly once when a creator card enters the viewport multiple times', () => {
    render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'creator' }}
      />,
    )

    FakeIntersectionObserver.instances[0]?.trigger(false)
    FakeIntersectionObserver.instances[0]?.trigger(true)
    FakeIntersectionObserver.instances[0]?.trigger(false)
    FakeIntersectionObserver.instances[0]?.trigger(true)

    expect(mockCustomFetch).toHaveBeenCalledOnce()
    expect(mockCustomFetch).toHaveBeenCalledWith('/v1/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        event_name: 'payment_card_seen',
        payload: { declared_payment_id: 'pay-1' },
      }),
    })
  })

  it('does not track payment_card_seen for brand viewers', () => {
    render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'brand' }}
      />,
    )

    expect(FakeIntersectionObserver.instances).toHaveLength(0)
    expect(mockCustomFetch).not.toHaveBeenCalled()
  })

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'creator' }}
      />,
    )

    const observer = FakeIntersectionObserver.instances[0]
    expect(observer).toBeDefined()

    unmount()

    expect(observer?.disconnect).toHaveBeenCalledOnce()
  })
})
