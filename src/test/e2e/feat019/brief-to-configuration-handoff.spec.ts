import { expect, test } from '../fixtures'

// E2E: completar el brief builder y aterrizar directo en el wizard de
// configuración sin pasos intermedios. Valida que el handoff se sienta
// como un solo proceso: P4 → /configuration → /configuration/content_type
// con el primer step listo para interactuar, sin loaders bloqueantes ni
// pantallas de transición.
test('brief → configuración: handoff sin fricción hasta el primer step', async ({
  page,
  onboardedBrandUser,
}) => {
  test.setTimeout(180_000)
  await onboardedBrandUser.signIn(page)

  await page.goto('/campaigns/new')

  // P1: input mínimo del brief (URL + descripción).
  await page.getByLabel(/url de la campaña/i).fill('https://marz.com')
  await page
    .getByLabel(/descripci/i)
    .fill('Marca de bebidas saludables para Gen Z')
  await page.getByRole('button', { name: /analizar/i }).click()

  // P2 → P3: la UI espera el procesamiento del brief.
  await expect(page.getByText(/revisá tu brief/i)).toBeVisible({
    timeout: 90_000,
  })

  // P3: completar los tres campos requeridos para habilitar Confirmar.
  await page
    .getByLabel(/^nombre/i)
    .first()
    .fill('Handoff campaign e2e')
  await page.getByRole('combobox').first().click()
  await page.getByRole('option').first().click()
  await page.getByLabel(/presupuesto/i).fill('5000')

  const confirmar = page.getByRole('button', { name: /^confirmar/i })
  await expect(confirmar).toBeEnabled({ timeout: 5_000 })

  // P4 monta y dispara POST /v1/campaigns automáticamente. El handoff
  // navega directo a /campaigns/{id}/configuration/{step} cuando el POST
  // resuelve OK. Esperamos esa URL como señal de éxito en lugar de
  // sniffear el response del network (sensible a retries de auth).
  await confirmar.click()

  await expect(page).toHaveURL(
    /\/campaigns\/[0-9a-f-]{36}\/configuration\/(content_type|pricing_model|targeting|bonus|review)/i,
    { timeout: 60_000 },
  )

  // Verifica que el step de contenido es interactivo: la card "Influencer
  // Posts" está disponible y "UGC Videos" aparece como Próximamente.
  const influencerPosts = page.getByRole('button', {
    name: /influencer posts/i,
  })
  await expect(influencerPosts).toBeVisible({ timeout: 10_000 })
  await expect(influencerPosts).toBeEnabled()

  const ugcVideos = page.getByRole('button', { name: /ugc videos/i })
  await expect(ugcVideos).toBeVisible()
  await expect(ugcVideos).toBeDisabled()
  await expect(page.getByText(/próximamente/i)).toBeVisible()

  // Continuar el flujo: seleccionar contenido y avanzar al próximo step.
  const continuar = page.getByRole('button', { name: /continuar/i })
  await expect(continuar).toBeDisabled()

  await influencerPosts.click()
  await expect(continuar).toBeEnabled()

  await continuar.click()

  // Tras confirmar el primer step, la URL debe avanzar a otro step (no
  // volver al detalle ni recargar). Esto valida que la cadena brief →
  // configuración → step → siguiente step se mantiene sin saltos visibles.
  await expect(page).toHaveURL(
    /\/campaigns\/[0-9a-f-]{36}\/configuration\/(pricing_model|targeting|bonus|review)/i,
    { timeout: 15_000 },
  )
})
