import { expect, test } from '@playwright/test'

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

  test('brand requests changes and card appears in timeline and panel', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    // Brand opens "Request changes" on the latest draft card.
    const requestChangesButton = page.getByRole('button', {
      name: /request changes/i,
    })
    await expect(requestChangesButton).toBeVisible({ timeout: 5_000 })
    await requestChangesButton.click()

    // Fill categories and notes in the modal, then submit.
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await modal.locator('textarea').fill('Adjust product placement timing')
    await modal
      .getByRole('button', { name: /submit|send/i })
      .click({ timeout: 5_000 })

    // Assert "Changes requested" card appears in the timeline.
    const timeline = page.locator('[data-testid="message-timeline"]')
    await expect(timeline.getByText(/changes requested/i)).toBeVisible({
      timeout: 10_000,
    })

    // Assert the deliverable panel shows the version as "Changes requested".
    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    await expect(panel).toBeVisible()
    await expect(
      panel.locator('[data-testid="draft-version-row"]'),
    ).toContainText('Changes requested')
  })

  test('creator uploads v2 after changes requested and brand approves', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    // Creator opens upload from the deliverable panel.
    const panel = page.locator('[data-testid="deliverable-list-panel"]')
    await expect(panel).toBeVisible()
    const uploadButton = panel.getByRole('button', {
      name: /upload draft v\d+/i,
    })
    await expect(uploadButton).toBeVisible({ timeout: 5_000 })
    await uploadButton.click()

    // Upload a video file via the dialog drop zone.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const fileInput = dialog.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'draft_v2.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake-video-content'),
    })

    // Wait for upload completion and dialog close.
    await expect(dialog).not.toBeVisible({ timeout: 30_000 })

    // Assert "Draft submitted" card with v2 appears in timeline.
    const timeline = page.locator('[data-testid="message-timeline"]')
    await expect(timeline.getByText(/draft submitted/i)).toBeVisible({
      timeout: 10_000,
    })

    // Brand clicks "Approve draft".
    const approveButton = page.getByRole('button', {
      name: /approve draft/i,
    })
    await expect(approveButton).toBeVisible({ timeout: 5_000 })
    await approveButton.click()

    // Assert "Draft approved" card appears in timeline.
    await expect(timeline.getByText(/draft approved/i)).toBeVisible({
      timeout: 10_000,
    })
  })
})
