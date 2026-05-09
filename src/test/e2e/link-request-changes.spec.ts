import { expect, test } from '@playwright/test'

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('request changes on link flow', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('brand owner requests changes on a submitted link', async ({ page }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const timeline = page.locator('[data-testid="message-timeline"]')
    await expect(timeline.getByText(/published link/i)).toBeVisible({
      timeout: 15_000,
    })

    await timeline
      .getByRole('button', { name: /request changes on link/i })
      .click()

    const modal = page.getByRole('dialog', {
      name: /request changes on link/i,
    })
    await expect(modal).toBeVisible()

    await modal.getByRole('button', { name: /audio/i }).click()
    await modal
      .getByLabel(/additional notes/i)
      .fill('Please update the published cut to match the approved draft.')
    await modal
      .getByRole('button', { name: /request changes on link/i })
      .click()

    await expect(timeline.getByText(/changes requested/i)).toBeVisible({
      timeout: 15_000,
    })

    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    await expect(
      panel.getByRole('button', { name: /submit link/i }),
    ).toBeVisible({ timeout: 15_000 })
  })
})
