import { expect, test } from '@playwright/test'

// E2E for multistage deliverable panel and stage unlock.
// Requires: backend endpoints for conversation deliverables + WS stage events.
// Set E2E_CONVERSATION_ID for the fixture conversation.

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('multistage deliverable panel', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('panel is visible on conversation page', async ({ page }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const panel = page.locator('aside').last()
    await expect(panel).toBeVisible()
  })

  test('stage unlock after last deliverable approval (requires WS F.5)', async ({
    page,
  }) => {
    test.skip(
      true,
      'Skipped: requires backend WS stage.approved + stage.opened events (F.5)',
    )

    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    // TODO: Implement once F.5 WS handlers are active.
    // 1. Identify the active stage and its last pending deliverable.
    // 2. As brand, approve the draft of that deliverable.
    // 3. Assert that the next stage transitions from locked to open without reload.
  })
})
