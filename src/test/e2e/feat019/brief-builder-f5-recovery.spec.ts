import { test, expect } from '../fixtures'

// E2E: F5 recovery on P2 / P3.
// After processing finishes, the user reloads the page. P2 must call GET
// /processing/{token}, see state=completed|partial, and jump straight to P3
// without re-dispatching POST /process (which would 409).
test('F5 after processing completes hydrates draft and lands on P3', async ({
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

  // Wait for the WS event that lands the user on P3.
  await expect(page.getByText(/revisá tu brief/i)).toBeVisible({
    timeout: 90_000,
  })

  // Hard reload. After F5 the wizard should restore from sessionStorage,
  // remount on /progress (because store says currentPhase=2), then the
  // useBriefProcessingState hook hits GET /processing/{token}, sees
  // state=completed|partial and forwards to P3.
  await page.reload()

  await expect(page.getByText(/revisá tu brief/i)).toBeVisible({
    timeout: 30_000,
  })
})
