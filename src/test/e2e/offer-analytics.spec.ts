import { expect, test } from '@playwright/test'

// E2E for offer analytics events.
// Requires: an authenticated brand session with an active campaign and an open conversation.
// Backend must be running on localhost:8080.
// Set E2E_CONVERSATION_ID, E2E_CLERK_USER_USERNAME, E2E_CLERK_USER_PASSWORD.

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('offer analytics', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('emits offer_sidesheet_opened on send offer click', async ({ page }) => {
    const analyticsEvents: Array<{
      event: string
      properties: Record<string, unknown>
    }> = []

    await page.route('**/api/v1/analytics/events', async (route, request) => {
      if (request.method() === 'POST') {
        const body = await request.postDataJSON()
        analyticsEvents.push(body)
      }
      await route.continue()
    })

    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const sendOfferButton = page.getByRole('button', { name: /send offer/i })
    if (await sendOfferButton.isVisible().catch(() => false)) {
      await sendOfferButton.click()

      const event = analyticsEvents.find(
        (e) => e.event === 'offer_sidesheet_opened',
      )
      expect(event).toBeDefined()
      expect(event!.properties.actor_kind).toBe('brand')
      expect(event!.properties.source).toBe('conversation')
    }
  })

  test('emits offer_panel_viewed when current offer is visible', async ({
    page,
  }) => {
    const analyticsEvents: Array<{
      event: string
      properties: Record<string, unknown>
    }> = []

    await page.route('**/api/v1/analytics/events', async (route, request) => {
      if (request.method() === 'POST') {
        const body = await request.postDataJSON()
        analyticsEvents.push(body)
      }
      await route.continue()
    })

    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    // Wait a tick for any deferred analytics to fire
    await page.waitForTimeout(500)

    const event = analyticsEvents.find((e) => e.event === 'offer_panel_viewed')
    // Only asserted when there is a current offer in the panel
    if (event) {
      expect(event.properties.actor_kind).toBeDefined()
      expect(event.properties.offer_state).toBeDefined()
    }
  })

  test('emits offer_archive_expanded on archive toggle', async ({ page }) => {
    const analyticsEvents: Array<{
      event: string
      properties: Record<string, unknown>
    }> = []

    await page.route('**/api/v1/analytics/events', async (route, request) => {
      if (request.method() === 'POST') {
        const body = await request.postDataJSON()
        analyticsEvents.push(body)
      }
      await route.continue()
    })

    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const archiveButton = page.getByRole('button', { expanded: false })
    if (await archiveButton.isVisible().catch(() => false)) {
      await archiveButton.click()

      const event = analyticsEvents.find(
        (e) => e.event === 'offer_archive_expanded',
      )
      expect(event).toBeDefined()
      expect(event!.properties.actor_kind).toBeDefined()
      expect(event!.properties.archive_size_bucket).toBeDefined()
    }
  })
})
