import { test } from '@playwright/test'

// E2E for request changes flow on a single offer deliverable.
// Requires: backend endpoints for conversation deliverables + WS changes events.
// Set E2E_CONVERSATION_ID for the fixture conversation.

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('request changes flow', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('brand requests changes and card appears in timeline', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    // TODO: Implement once backend WS changes.requested events are active.
    // 1. As brand, click "Request changes" on the current draft.
    // 2. Fill categories and notes, submit.
    // 3. Assert that a "Changes requested" card appears in the timeline.
    test.skip(true, 'Skipped: requires backend WS changes.requested events')
  })

  test('creator uploads v2 after changes requested', async ({ page }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    // TODO: Implement once backend supports draft upload + approval E2E.
    // 1. As creator, upload a new draft version.
    // 2. Assert "Draft submitted" card appears with v2.
    // 3. As brand, click "Approve draft".
    // 4. Assert "Draft approved" card appears.
    test.skip(true, 'Skipped: requires full draft upload + approval E2E')
  })
})
