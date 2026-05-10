import { test, expect } from '../fixtures'

// E2E: F5 while still on P2 (processing not finished yet).
// User submits P1 → lands on P2 → reloads. After reload P2 must call
// GET /processing/{token} and either:
//  - in_progress  → keep showing P2 progress and wait for WS
//  - completed/partial → jump to P3
//  - 404 expired → reset to P1
// Today user reports neither happens.
test('F5 on P2 while processing is in_progress keeps progress visible', async ({
  page,
  onboardedBrandUser,
}) => {
  test.setTimeout(120_000)
  await onboardedBrandUser.signIn(page)

  await page.goto('/campaigns/new')
  await page.getByLabel(/sitio web/i).fill('https://marz.com')
  await page
    .getByLabel(/descripci/i)
    .fill('Marca de bebidas saludables para Gen Z')
  await page.getByRole('button', { name: /analizar/i }).click()

  // Wait until P2 is mounted.
  await expect(page.getByText(/generando tu brief/i)).toBeVisible({
    timeout: 15_000,
  })

  // F5 immediately, before processing finishes.
  console.log('URL before reload:', page.url())

  // Capture network calls after reload to confirm the GET fires.
  const getProcessingCalls: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (/\/v1\/campaigns\/brief-builder\/processing\//.test(url)) {
      getProcessingCalls.push(url)
    }
  })

  await page.reload()
  console.log('URL right after reload:', page.url())

  // After reload, P2 should still render (or jump to P3 if processing
  // finished while reloading). What MUST NOT happen: a redirect back to P1
  // (input form) or a stuck blank screen.
  await Promise.race([
    page
      .getByText(/generando tu brief/i)
      .waitFor({ state: 'visible', timeout: 30_000 }),
    page
      .getByText(/revisá tu brief/i)
      .waitFor({ state: 'visible', timeout: 30_000 }),
  ])

  // Capture URL to confirm we are on /progress or /review, not /input.
  const url = page.url()
  expect(url).toMatch(/\/campaigns\/new\/(progress|review)$/)

  // GET must have fired exactly once after reload.
  console.log('GET /processing calls after reload:', getProcessingCalls)
  expect(getProcessingCalls.length).toBeGreaterThan(0)
})
