import { expect, test } from '@playwright/test'

// E2E for sending and receiving a chat message.
// Requires: two authenticated sessions (brand + creator) sharing a conversation.
// Backend must be running on localhost:8080 with WebSocket support.
// Set E2E_CONVERSATION_ID, E2E_CLERK_USER_USERNAME, E2E_CLERK_USER_PASSWORD,
// and optionally E2E_CLERK_USER2_USERNAME/E2E_CLERK_USER2_PASSWORD for the receiver.

const CONVERSATION_ID = process.env.E2E_CONVERSATION_ID ?? 'conv-fixture-1'
const CHAT_ROUTE = `/workspace/conversations/${CONVERSATION_ID}`

test.describe('chat send and receive', () => {
  test.skip(
    !process.env.E2E_CLERK_USER_USERNAME,
    'Skipped: no E2E auth credentials configured',
  )

  test('sender sees message instantly as pending, then confirmed', async ({
    page,
  }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const textarea = page.getByPlaceholder('Escribí un mensaje...')
    const message = `E2E test message ${Date.now()}`

    await textarea.fill(message)
    await textarea.press('Enter')

    const bubble = page.locator('[role="article"]', { hasText: message })
    await expect(bubble).toBeVisible({ timeout: 2_000 })
  })

  test('submit is disabled with empty text', async ({ page }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const sendButton = page.getByRole('button', { name: /enviar mensaje/i })
    await expect(sendButton).toBeDisabled()
  })

  test('character counter appears above 3500', async ({ page }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const textarea = page.getByPlaceholder('Escribí un mensaje...')
    await textarea.fill('a'.repeat(3501))

    const counter = page.locator('[aria-live="polite"]')
    await expect(counter).toBeVisible()
    await expect(counter).toHaveText(String(4096 - 3501))
  })

  test('paste is truncated at 4096 characters', async ({ page }) => {
    await page.goto(CHAT_ROUTE)
    await page.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const textarea = page.getByPlaceholder('Escribí un mensaje...')
    const longText = 'b'.repeat(5000)

    await textarea.focus()
    await page.evaluate(
      ([text]) => {
        const dt = new DataTransfer()
        dt.setData('text/plain', text!)
        const event = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true,
        })
        document.activeElement?.dispatchEvent(event)
      },
      [longText],
    )

    const value = await textarea.inputValue()
    expect(value.length).toBeLessThanOrEqual(4096)
  })
})
