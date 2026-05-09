import { expect, test } from '../fixtures'

test.describe('brand payments highlight navigation', () => {
  test('row click opens the conversation and highlights the payment card', async ({
    chatPairWithCompletedDeliverable,
  }) => {
    const { brandPage, conversationId } = chatPairWithCompletedDeliverable

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

    await brandPage.goto('/payments')
    await expect(
      brandPage.getByRole('row', { name: /E2E Creator/i }),
    ).toBeVisible({ timeout: 10_000 })

    await brandPage.getByRole('row', { name: /E2E Creator/i }).click()

    await expect(brandPage).toHaveURL(
      /\/workspace\/conversations\/[^?]+\?(.+&)?highlightPaymentId=/,
    )
    await expect(
      brandPage.locator('[data-testid="payment-marked-card"]'),
    ).toBeVisible({ timeout: 10_000 })
    await expect(brandPage.locator('[data-highlighted="true"]')).toBeVisible()
  })
})
