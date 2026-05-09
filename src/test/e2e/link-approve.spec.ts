import { expect, test } from '@playwright/test'

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('approve link flow', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('brand owner approves a submitted link and sees the completed status', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const timeline = page.locator('[data-testid="message-timeline"]')
    await expect(timeline.getByText(/published link/i)).toBeVisible({
      timeout: 15_000,
    })

    await timeline.getByRole('button', { name: /approve link/i }).click()

    await expect(timeline.getByText(/link approved/i)).toBeVisible({
      timeout: 15_000,
    })

    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    await expect(panel).toContainText(/link approved/i, { timeout: 15_000 })
  })

  test.skip('brand member viewers do not see link review actions', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    await expect(
      page.getByRole('button', { name: /approve link/i }),
    ).not.toBeVisible()
    await expect(
      page.getByRole('button', { name: /request changes on link/i }),
    ).not.toBeVisible()
  })
})
