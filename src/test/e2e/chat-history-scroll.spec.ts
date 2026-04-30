import { expect, test } from '@playwright/test'

// E2E for chat history infinite scroll.
// Requires: authenticated session + conversation with 60+ messages.
// Backend must be running on localhost:8080.
// CHAT_ROUTE needs a real conversationId from the test fixture/seed data.
// Update E2E_CONVERSATION_ID env var or hardcode a seeded conversation id.

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('chat history scroll', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('loads more messages on scroll up without visual jump', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[role="article"]', { timeout: 10_000 })

    const timeline = page.locator('[data-testid="message-timeline"]')
    const initialMessages = await timeline.locator('[role="article"]').count()
    expect(initialMessages).toBeGreaterThan(0)

    const lastVisibleMessage = timeline.locator('[role="article"]').last()
    const initialBounds = await lastVisibleMessage.boundingBox()

    await timeline.evaluate((el) => {
      el.scrollTop = 0
    })

    await expect(timeline.locator('[role="article"]')).not.toHaveCount(
      initialMessages,
      { timeout: 5000 },
    )

    const messagesAfterScroll = await timeline
      .locator('[role="article"]')
      .count()
    expect(messagesAfterScroll).toBeGreaterThan(initialMessages)

    const boundsAfterLoad = await lastVisibleMessage.boundingBox()
    if (initialBounds && boundsAfterLoad) {
      const drift = Math.abs(boundsAfterLoad.y - initialBounds.y)
      expect(drift).toBeLessThan(10)
    }
  })

  test('shows "Inicio de la conversación" when scrolled to the top of all history', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[role="article"]', { timeout: 10_000 })

    const timeline = page.locator('[data-testid="message-timeline"]')
    const beginningPill = page.getByText('Inicio de la conversación')

    for (let i = 0; i < 20; i++) {
      await timeline.evaluate((el) => {
        el.scrollTop = 0
      })
      await expect(timeline.locator('[role="article"]')).not.toHaveCount(0, {
        timeout: 2000,
      })
      if (await beginningPill.isVisible().catch(() => false)) break
    }

    await expect(beginningPill).toBeVisible({ timeout: 5000 })
  })

  test('renders day separators between messages from different days', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[role="article"]', { timeout: 10_000 })

    const separators = page.locator('[role="separator"]')
    const count = await separators.count()
    expect(count).toBeGreaterThan(0)
  })
})
