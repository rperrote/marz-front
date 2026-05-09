import { expect, test } from '@playwright/test'

const CONVERSATION_ID =
  process.env.E2E_MULTISTAGE_CONVERSATION_ID ??
  process.env.E2E_CONVERSATION_ID ??
  'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('multistage link approval flow', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('approving the active stage final link opens the next stage', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    await expect(panel).toBeVisible({ timeout: 10_000 })

    const approveLinkButton = page
      .getByRole('button', { name: /approve link/i })
      .last()
    test.skip(
      (await approveLinkButton.count()) === 0,
      'Skipped: fixture has no submitted final link for the active stage',
    )

    const stageOpenedMessagesBefore = await page
      .locator('[data-testid="stage-opened-bubble"]')
      .count()

    await approveLinkButton.click()

    const timeline = page.locator('[data-testid="message-timeline"]')
    await expect(
      timeline.locator('[data-testid="stage-opened-bubble"]'),
    ).toHaveCount(stageOpenedMessagesBefore + 1, { timeout: 15_000 })

    await expect(panel.getByText(/link approved/i)).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      panel.getByRole('button', { name: /upload draft/i }).first(),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('approving the final stage final link completes without opening another stage', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    await expect(panel).toBeVisible({ timeout: 10_000 })

    const approveLinkButton = page
      .getByRole('button', { name: /approve final stage link/i })
      .or(page.getByRole('button', { name: /approve link/i }))
      .last()
    test.skip(
      (await approveLinkButton.count()) === 0,
      'Skipped: fixture has no submitted final-stage link',
    )

    const stageOpenedMessagesBefore = await page
      .locator('[data-testid="stage-opened-bubble"]')
      .count()

    await approveLinkButton.click()

    const timeline = page.locator('[data-testid="message-timeline"]')
    await expect(panel.getByText(/link approved/i)).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      timeline.locator('[data-testid="stage-opened-bubble"]'),
    ).toHaveCount(stageOpenedMessagesBefore, { timeout: 2_000 })
  })
})
