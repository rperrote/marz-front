import { expect, test } from '@playwright/test'

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('submit link flow', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('creator submits a YouTube URL and sees the link submitted card', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    await expect(panel).toBeVisible({ timeout: 5_000 })

    await panel.getByRole('button', { name: /submit link/i }).click()

    const sheet = page.getByRole('dialog', { name: /submit link/i })
    await expect(sheet).toBeVisible()
    await sheet
      .getByLabel(/published url/i)
      .fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await sheet.getByRole('button', { name: /send link/i }).click()

    await expect(sheet).not.toBeVisible({ timeout: 15_000 })

    const timeline = page.locator('[data-testid="message-timeline"]')
    await expect(timeline.getByText(/published link/i)).toBeVisible({
      timeout: 15_000,
    })
    await expect(timeline.getByText(/youtube\.com\/watch/i)).toBeVisible()
  })
})
