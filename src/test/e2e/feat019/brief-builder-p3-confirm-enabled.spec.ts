import { test, expect } from '../fixtures'

// E2E: in P3 (Review), filling the three required campaign fields
// (name, objective, budget) must enable the "Confirmar" button so it can
// actually be clicked. Repro for: button visible but not clickable.
test('P3: Confirmar becomes enabled and clickable after required fields are filled', async ({
  page,
  onboardedBrandUser,
}) => {
  test.setTimeout(120_000)
  await onboardedBrandUser.signIn(page)

  await page.goto('/campaigns/new')

  await page.getByLabel(/url de la campaña/i).fill('https://marz.com')
  await page
    .getByLabel(/descripci/i)
    .fill('Marca de bebidas saludables para Gen Z')
  await page.getByRole('button', { name: /analizar/i }).click()

  // P2 → wait until P3 is reached (partial or completed status both navigate).
  await expect(page.getByText(/revisá tu brief/i)).toBeVisible({
    timeout: 90_000,
  })

  const confirmar = page.getByRole('button', { name: /^confirmar/i })

  // Initially disabled because required fields may be empty.
  await expect(confirmar).toBeDisabled()

  // Fill the three required fields under the Campaña section.
  await page
    .getByLabel(/^nombre/i)
    .first()
    .fill('Campaña test e2e')

  // Objective is a Select; open and pick first option.
  await page.getByRole('combobox').first().click()
  await page.getByRole('option').first().click()

  await page.getByLabel(/presupuesto/i).fill('5000')

  // Now the button must be enabled and actually clickable.
  await expect(confirmar).toBeEnabled({ timeout: 5_000 })

  // Capture the POST /v1/campaigns request fired automatically when P4 mounts.
  const createReq = page.waitForRequest(
    (req) => req.method() === 'POST' && /\/v1\/campaigns(\?|$)/.test(req.url()),
    { timeout: 15_000 },
  )
  const createRes = page.waitForResponse(
    (res) =>
      res.request().method() === 'POST' &&
      /\/v1\/campaigns(\?|$)/.test(res.url()),
    { timeout: 30_000 },
  )

  await confirmar.click()

  // Advance to P4.
  await expect(page).toHaveURL(/\/campaigns\/new\/confirm/i, {
    timeout: 10_000,
  })

  // The mutation fires on mount; ensure the request actually went out.
  const req = await createReq
  expect(req.postDataJSON()).toMatchObject({
    name: 'Campaña test e2e',
    objective: 'brand_awareness',
  })

  const res = await createRes

  if (res.ok()) {
    // Success: P4 shows the created state and waits for an explicit handoff.
    await expect(page.getByText(/campaña creada/i)).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /configurar campaña/i }).click()
    await expect(page).toHaveURL(/\/campaigns\/[^/]+\/configuration/i, {
      timeout: 15_000,
    })
  } else {
    // Error path: P4 renders an error screen with a retry/back button.
    await expect(page.getByText(/error al crear la campaña/i)).toBeVisible({
      timeout: 10_000,
    })
  }
})
