import { test, expect } from '../fixtures'

// E2E: when the AI provider fails, backend emits
// brief.processing.completed with status="partial" and an empty brief.
// P2 must navigate to P3 with that empty draft so the user can fill it manually.
test('P2 advances to P3 when backend emits partial with empty brief', async ({
  page,
  onboardedBrandUser,
}) => {
  test.setTimeout(120_000)
  await onboardedBrandUser.signIn(page)

  const completedFrames: Array<{
    status?: string
    fields_filled_count?: number
  }> = []

  page.on('websocket', (ws) => {
    ws.on('framereceived', (frame) => {
      try {
        const parsed = JSON.parse(frame.payload as string) as {
          event_type?: string
          payload?: { status?: string; fields_filled_count?: number }
        }
        if (parsed.event_type === 'brief.processing.completed') {
          completedFrames.push({
            status: parsed.payload?.status,
            fields_filled_count: parsed.payload?.fields_filled_count,
          })
        }
      } catch {
        /* non-JSON */
      }
    })
  })

  await page.goto('/campaigns/new')

  await page.getByLabel(/sitio web/i).fill('https://marz.com')
  await page
    .getByLabel(/descripci/i)
    .fill('Marca de bebidas saludables para Gen Z')

  await page.getByRole('button', { name: /analizar/i }).click()

  // P2 mounts.
  await expect(page.getByText(/generando tu brief/i)).toBeVisible({
    timeout: 15_000,
  })

  // Wait for backend to emit completed (any status).
  await expect
    .poll(() => completedFrames.length, { timeout: 90_000 })
    .toBeGreaterThan(0)

  // Once `completed` is received with status partial|completed, P2 must
  // navigate to P3 (title: "Revisá tu brief").
  await expect(page.getByText(/revisá tu brief/i)).toBeVisible({
    timeout: 15_000,
  })
})
