import { expect, getClerkSessionToken, test } from '../fixtures'

const API_BASE_URL = (
  process.env.VITE_API_URL ??
  process.env.API_URL ??
  'http://localhost:8080'
).replace(/\/$/, '')

interface AnalyticsEventBody {
  event_name: string
  payload?: unknown
}

function parseAnalyticsEventBody(
  postData: string | null,
): AnalyticsEventBody | null {
  if (!postData) return null

  const parsed = JSON.parse(postData) as unknown
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('event_name' in parsed) ||
    typeof parsed.event_name !== 'string'
  ) {
    return null
  }

  return {
    event_name: parsed.event_name,
    payload: 'payload' in parsed ? parsed.payload : undefined,
  }
}

test.describe('mark as paid', () => {
  test('brand owner marks a completed deliverable as paid', async ({
    chatPairWithCompletedDeliverable,
  }) => {
    test.skip(
      !chatPairWithCompletedDeliverable.deliverableId,
      'Skipped: test API no longer seeds completed deliverables',
    )

    await chatPairWithCompletedDeliverable.brandPage.goto(
      `/workspace/conversations/${chatPairWithCompletedDeliverable.conversationId}`,
    )

    await expect(
      chatPairWithCompletedDeliverable.brandPage.locator(
        '[data-testid="message-timeline"]',
      ),
    ).toBeVisible({ timeout: 10_000 })

    const markAsPaidButton =
      chatPairWithCompletedDeliverable.brandPage.getByRole('button', {
        name: /mark as paid/i,
      })
    await expect(markAsPaidButton).toBeVisible({ timeout: 10_000 })
    await markAsPaidButton.click()

    const sheet = chatPairWithCompletedDeliverable.brandPage.getByRole(
      'dialog',
      {
        name: /mark as paid/i,
      },
    )
    await expect(sheet).toBeVisible()
    await sheet.getByRole('button', { name: /^confirm$/i }).click()

    const confirmDialog = chatPairWithCompletedDeliverable.brandPage.getByRole(
      'dialog',
      {
        name: /confirm payment/i,
      },
    )
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole('button', { name: /^confirm$/i }).click()

    await expect(
      chatPairWithCompletedDeliverable.brandPage.locator(
        '[data-testid="payment-marked-card"]',
      ),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('programmatic guard rejects non-owner mark as paid invocation', async ({
    chatPairWithCompletedDeliverable,
  }) => {
    const { creatorPage, deliverableId } = chatPairWithCompletedDeliverable

    test.skip(!deliverableId, 'Skipped: test API no longer seeds completed deliverables')

    const token = await getClerkSessionToken(creatorPage)
    const response = await creatorPage.request.post(
      `${API_BASE_URL}/v1/deliverables/${deliverableId}/mark-as-paid`,
      {
        data: { amount: '10.00' },
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    expect(response.status()).toBe(403)
  })

  test('creator sees payment card analytics once across viewport re-entry', async ({
    chatPairWithCompletedDeliverableScrollable,
  }) => {
    const { brandPage, creatorPage, conversationId, deliverableId } =
      chatPairWithCompletedDeliverableScrollable
    test.skip(!deliverableId, 'Skipped: test API no longer seeds completed deliverables')

    await brandPage.goto(`/workspace/conversations/${conversationId}`)

    await expect(
      brandPage.locator('[data-testid="message-timeline"]'),
    ).toBeVisible({ timeout: 10_000 })

    await brandPage.getByRole('button', { name: /mark as paid/i }).click()
    await brandPage
      .getByRole('dialog', { name: /mark as paid/i })
      .getByRole('button', { name: /^confirm$/i })
      .click()
    await brandPage
      .getByRole('dialog', { name: /confirm payment/i })
      .getByRole('button', { name: /^confirm$/i })
      .click()

    await expect(
      brandPage.locator('[data-testid="payment-marked-card"]'),
    ).toBeVisible({ timeout: 10_000 })

    const analyticsEvents: AnalyticsEventBody[] = []
    await creatorPage.route('**/analytics/events', async (route) => {
      if (route.request().method() === 'POST') {
        const body = parseAnalyticsEventBody(route.request().postData())
        if (body) analyticsEvents.push(body)
      }

      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: '{}',
      })
    })

    await creatorPage.goto(`/workspace/conversations/${conversationId}`)

    const card = creatorPage.locator('[data-testid="payment-marked-card"]')
    await expect(card).toBeVisible({ timeout: 10_000 })

    await expect
      .poll(
        () =>
          analyticsEvents.filter(
            (event) => event.event_name === 'payment_card_seen',
          ).length,
      )
      .toBe(1)

    await expect
      .poll(() => {
        const event = analyticsEvents.find(
          (item) => item.event_name === 'payment_card_seen',
        )
        if (
          typeof event?.payload !== 'object' ||
          event.payload === null ||
          !('declared_payment_id' in event.payload)
        ) {
          return false
        }
        return typeof event.payload.declared_payment_id === 'string'
      })
      .toBe(true)

    await creatorPage.locator('[data-testid="message-timeline"]').hover()
    await creatorPage.mouse.wheel(0, -3000)
    await expect(card).not.toBeInViewport()
    await creatorPage.mouse.wheel(0, 3000)
    await expect(card).toBeInViewport()

    await expect
      .poll(
        () =>
          analyticsEvents.filter(
            (event) => event.event_name === 'payment_card_seen',
          ).length,
        { timeout: 1_000 },
      )
      .toBe(1)
  })
})
