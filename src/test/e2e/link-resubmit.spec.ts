import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('re-submit link flow', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('creator can submit a new link before approval and keeps both cards in chronological order', async ({
    page,
    testUser,
  }) => {
    await testUser.signIn(page)
    // Prerequisite: CHAT_ROUTE must point to a conversation fixture whose creator
    // has a deliverable in draft_approved or link_submitted state.
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    const timeline = page.locator('[data-testid="message-timeline"]')
    const firstUrl = 'https://www.youtube.com/watch?v=resubmit111'
    const secondUrl = 'https://www.youtube.com/watch?v=resubmit222'

    await submitLink(panel, page, firstUrl)
    await expect(timeline.getByText(/resubmit111/i)).toBeVisible({
      timeout: 15_000,
    })

    await submitLink(panel, page, secondUrl)
    await expect(timeline.getByText(/resubmit222/i)).toBeVisible({
      timeout: 15_000,
    })

    await expect(timeline.getByText(/resubmit111/i)).toBeVisible()
    await expect(panel.getByText(secondUrl)).toBeVisible({ timeout: 15_000 })

    const timelineText = await timeline.textContent()
    const firstIndex = timelineText?.indexOf('resubmit111') ?? -1
    const secondIndex = timelineText?.indexOf('resubmit222') ?? -1
    expect(firstIndex).toBeGreaterThanOrEqual(0)
    expect(firstIndex).toBeLessThan(secondIndex)
  })

  test('creator can re-submit when the previous link has changes requested', async ({
    page,
    testUser,
  }) => {
    await testUser.signIn(page)
    // Prerequisite: CHAT_ROUTE must point to a conversation fixture whose creator
    // has a deliverable with a previous link changes-requested state.
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    const reSubmitButtons = await panel
      .getByRole('button', { name: /re-submit link/i })
      .count()
    test.skip(
      reSubmitButtons === 0,
      'Skipped: fixture does not start with a link changes-requested state',
    )

    const nextUrl = 'https://www.youtube.com/watch?v=changes333'
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/links') &&
        response.request().method() === 'POST',
    )

    await submitLink(panel, page, nextUrl)

    const response = await responsePromise
    expect(response.status()).toBe(201)
    await expect(panel.getByText(nextUrl)).toBeVisible({ timeout: 15_000 })
    await expect(panel.getByText(/link review/i)).toBeVisible()
  })
})

async function submitLink(panel: Locator, page: Page, url: string) {
  const button = panel.getByRole('button', {
    name: /^(re-submit link|submit link)$/i,
  })
  await button.click()

  const sheet = page.getByRole('dialog', { name: /submit link/i })
  await expect(sheet).toBeVisible()
  await sheet.getByLabel(/published url/i).fill(url)
  await sheet.getByRole('button', { name: /send link/i }).click()
  await expect(sheet).not.toBeVisible({ timeout: 15_000 })
}
