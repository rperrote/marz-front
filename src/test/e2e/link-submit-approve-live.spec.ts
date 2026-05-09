import { test, expect } from './fixtures'

const WS_TIMEOUT = 2_000

test.describe('link submit/approve live panel updates', () => {
  test('creator submit link updates the brand panel without refresh', async ({
    chatPair,
  }) => {
    const { conversationId, brandPage, creatorPage } = chatPair
    const route = `/workspace/conversations/${conversationId}`
    const url = `https://www.youtube.com/watch?v=live${Date.now()}`

    await brandPage.goto(route)
    await creatorPage.goto(route)
    await brandPage.waitForSelector('[data-testid="deliverable-list-panel"]', {
      timeout: 10_000,
    })
    await creatorPage.waitForSelector(
      '[data-testid="deliverable-list-panel"]',
      {
        timeout: 10_000,
      },
    )

    const creatorPanel = creatorPage.locator(
      '[data-testid="deliverable-list-panel"]',
    )
    const submitButton = creatorPanel.getByRole('button', {
      name: /^submit link$/i,
    })
    test.skip(
      (await submitButton.count()) === 0,
      'Skipped: chatPair fixture has no draft_approved deliverable yet',
    )

    await submitButton.click()
    const sheet = creatorPage.getByRole('dialog', { name: /submit link/i })
    await sheet.getByLabel(/published url/i).fill(url)
    await sheet.getByRole('button', { name: /send link/i }).click()
    await expect(sheet).not.toBeVisible({ timeout: 15_000 })

    const brandPanel = brandPage.locator(
      '[data-testid="deliverable-list-panel"]',
    )
    await expect(brandPanel.getByText('Link submitted')).toBeVisible({
      timeout: WS_TIMEOUT,
    })
    await expect(brandPanel.getByRole('link', { name: url })).toBeVisible({
      timeout: WS_TIMEOUT,
    })
  })

  test('approving a link updates brand and creator panels without refresh', async ({
    chatPair,
  }) => {
    const { conversationId, brandPage, creatorPage } = chatPair
    const route = `/workspace/conversations/${conversationId}`

    await brandPage.goto(route)
    await creatorPage.goto(route)
    await brandPage.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })
    await creatorPage.waitForSelector(
      '[data-testid="deliverable-list-panel"]',
      {
        timeout: 10_000,
      },
    )

    const approveButton = brandPage.getByRole('button', {
      name: /approve link/i,
    })
    test.skip(
      (await approveButton.count()) === 0,
      'Skipped: chatPair fixture has no submitted link yet',
    )

    await approveButton.click()

    const brandPanel = brandPage.locator(
      '[data-testid="deliverable-list-panel"]',
    )
    const creatorPanel = creatorPage.locator(
      '[data-testid="deliverable-list-panel"]',
    )
    await expect(brandPanel.getByText('Link approved')).toBeVisible({
      timeout: WS_TIMEOUT,
    })
    await expect(creatorPanel.getByText('Link approved')).toBeVisible({
      timeout: WS_TIMEOUT,
    })
    await expect(brandPanel.getByRole('link').first()).toBeVisible({
      timeout: WS_TIMEOUT,
    })
    await expect(creatorPanel.getByRole('link').first()).toBeVisible({
      timeout: WS_TIMEOUT,
    })
  })
})
