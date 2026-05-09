import { test, expect } from './fixtures'

test.describe('Workspace shell — estado vacío', () => {
  test('brand onboarded ve el shell del workspace con rail', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/workspace')

    await expect(page).toHaveURL(/\/workspace/)
    await expect(page.getByTestId('app-shell')).toHaveCount(1)
    await expect(page.getByTestId('app-sidebar')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Creators' })).toBeVisible()
    const rail = page.getByRole('region', { name: /conversaciones/i })
    await expect(rail).toBeVisible()

    await expect(
      page.getByRole('searchbox', { name: /buscar conversaciones/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('tablist', { name: /filtrar conversaciones/i }),
    ).toBeVisible()
  })

  test('creator onboarded también accede al workspace (ruta unificada)', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/workspace')

    await expect(page).toHaveURL(/\/workspace/)
    await expect(page.getByTestId('app-shell')).toHaveCount(1)
    await expect(page.getByTestId('app-sidebar')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Creators' })).toHaveCount(0)
    await expect(
      page.getByRole('region', { name: /conversaciones/i }),
    ).toBeVisible()
  })

  test('cambiar tab de filtros sincroniza search params', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/workspace')
    await expect(
      page.getByRole('status', { name: /cargando conversaciones/i }),
    ).toBeHidden({ timeout: 30_000 })

    await page.getByRole('tab', { name: /sin leer/i }).click()
    await expect(page).toHaveURL(/filter=unread/)

    await page.getByRole('tab', { name: /por responder/i }).click()
    await expect(page).toHaveURL(/filter=needs_reply/)

    await page.getByRole('tab', { name: /todas/i }).click()
    await expect(page).not.toHaveURL(/filter=needs_reply/)
  })

  test('search debounced sincroniza a search param', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/workspace')
    await expect(
      page.getByRole('status', { name: /cargando conversaciones/i }),
    ).toBeHidden({ timeout: 30_000 })

    const search = page.getByRole('searchbox', {
      name: /buscar conversaciones/i,
    })
    await search.fill('hola')
    await expect(page).toHaveURL(/search=hola/, { timeout: 2_000 })
  })

  test('console del workspace queda sin errors propios', async ({
    page,
    onboardedBrandUser,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await onboardedBrandUser.signIn(page)
    await page.goto('/workspace')
    await expect(
      page.getByRole('region', { name: /conversaciones/i }),
    ).toBeVisible()

    const ownErrors = errors.filter((e) => {
      const lower = e.toLowerCase()
      if (lower.includes('clerk')) return false
      if (lower.includes('failed to fetch') && lower.includes('serverfn'))
        return false
      return true
    })
    expect(ownErrors).toHaveLength(0)
  })
})

test.describe('Workspace con conversación', () => {
  test('brand ve la conversación seedeada en el rail', async ({ chatPair }) => {
    const { brandPage } = chatPair

    await brandPage.goto('/workspace')
    await expect(
      brandPage.getByRole('status', { name: /cargando conversaciones/i }),
    ).toBeHidden({ timeout: 30_000 })

    const rail = brandPage.getByRole('region', { name: /conversaciones/i })
    await expect(rail).toBeVisible()
    await expect(rail.getByRole('listitem').first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test('creator ve la conversación seedeada en el rail', async ({
    chatPair,
  }) => {
    const { creatorPage } = chatPair

    await creatorPage.goto('/workspace')
    await expect(
      creatorPage.getByRole('status', { name: /cargando conversaciones/i }),
    ).toBeHidden({ timeout: 30_000 })

    const rail = creatorPage.getByRole('region', { name: /conversaciones/i })
    await expect(rail).toBeVisible()
    await expect(rail.getByRole('listitem').first()).toBeVisible({
      timeout: 5_000,
    })
  })
})
