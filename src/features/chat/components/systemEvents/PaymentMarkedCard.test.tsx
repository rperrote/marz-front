import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makePaymentMarkedMessage } from './offerEventCardTestUtils'
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

describe('PaymentMarkedCard', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    FakeIntersectionObserver.instances = []
    mockCustomFetch.mockReset()
    mockCustomFetch.mockResolvedValue({ status: 202, data: undefined })
  })

  it('renders the bubble for brand viewers', () => {
    render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'brand' }}
      />,
    )

    expect(screen.getByTestId('payment-marked-card')).toBeInTheDocument()
    expect(
      screen.getByRole('article', { name: 'Pago marcado' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Pago marcado')).toBeInTheDocument()
  })

  it('renders the bubble for creator viewers', () => {
    render(
      <PaymentMarkedCard
        message={makePaymentMarkedMessage()}
        viewer={{ kind: 'creator' }}
      />,
    )

    expect(screen.getByTestId('payment-marked-card')).toBeInTheDocument()
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
    expect(mockCustomFetch).toHaveBeenCalledWith(
      '/api/v1/analytics/events',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'payment_card_seen',
          properties: { declared_payment_id: 'pay-1' },
        }),
      }),
    )
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
