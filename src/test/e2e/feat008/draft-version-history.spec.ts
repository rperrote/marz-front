import { expect, test } from '@playwright/test'

// E2E for draft version history panel.
// Requires: backend endpoints for conversation deliverables with draft arrays.
// Set E2E_CONVERSATION_ID for the fixture conversation.

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('draft version history', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('shows three draft versions with correct statuses and current badge', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    await expect(panel).toBeVisible({ timeout: 5_000 })

    const rows = panel.locator('[data-testid="draft-version-row"]')
    await expect(rows).toHaveCount(3)

    // v1: changes_requested
    const v1 = rows.filter({ hasText: 'v1' })
    await expect(v1).toContainText('Changes requested')

    // v2: changes_requested
    const v2 = rows.filter({ hasText: 'v2' })
    await expect(v2).toContainText('Changes requested')

    // v3: approved and current
    const v3 = rows.filter({ hasText: 'v3' })
    await expect(v3).toContainText('Approved')
    await expect(v3).toContainText('Current')

    // Play buttons exist for all versions
    const playButtons = rows.locator('button[aria-label*="Play"]')
    await expect(playButtons).toHaveCount(3)
  })
})
