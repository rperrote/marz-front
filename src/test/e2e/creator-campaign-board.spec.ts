import { test, expect } from './fixtures'
import {
  gotoCreatorCampaignBoard,
  installCampaignBoardMocks,
} from './fixtures/campaign-board-mocks'

test.describe('creator campaign board', () => {
  test('creator completes board discovery, filtering, brief and application flow with manual multi-tab refresh', async ({
    context,
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    const campaignBoardMocks = await installCampaignBoardMocks(context)

    await gotoCreatorCampaignBoard(page)

    await expect(
      page.getByRole('heading', { name: 'Campañas abiertas' }),
    ).toBeVisible()
    await expect(page.getByText('4 campañas')).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Glow Lab Routine' }),
    ).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Aura Skin Serum Launch' }),
    ).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Fit Fuel Creators' }),
    ).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Urban Coffee Morning' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Categoría' }).click()
    await page.locator('label').filter({ hasText: 'Beauty' }).click()

    await expect(page).toHaveURL(/niches=beauty/)
    await expect(page.getByText('2 campañas')).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Glow Lab Routine' }),
    ).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Aura Skin Serum Launch' }),
    ).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Fit Fuel Creators' }),
    ).toBeHidden()

    await page.getByRole('button', { name: 'Intereses' }).click()
    await page.locator('label').filter({ hasText: 'Skincare' }).click()

    await expect(page).toHaveURL(/niches=beauty/)
    await expect(page).toHaveURL(/interests=skincare/)
    await expect(page.getByText('2 filtros activos')).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Glow Lab Routine' }),
    ).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Aura Skin Serum Launch' }),
    ).toBeVisible()

    await page.getByRole('combobox', { name: 'Ordenar campañas' }).click()
    await page.getByRole('option', { name: 'Fee más alto' }).click()

    await expect(page).toHaveURL(/sort=fee_desc/)
    await expect(
      page.getByRole('heading', {
        name: /Aura Skin Serum Launch|Glow Lab Routine/,
      }),
    ).toHaveText(['Aura Skin Serum Launch', 'Glow Lab Routine'])

    const secondPage = await context.newPage()
    await secondPage.goto(
      '/campaigns?niches=beauty&interests=skincare&sort=fee_desc',
    )

    const secondPageAuraCard = secondPage.getByRole('article', {
      name: 'Aura Skin Serum Launch',
    })
    await expect(secondPageAuraCard).toBeVisible()
    await expect(
      secondPageAuraCard.getByRole('button', { name: 'Postularme' }),
    ).toBeVisible()

    const auraCard = page.getByRole('article', {
      name: 'Aura Skin Serum Launch',
    })
    await auraCard.getByRole('button', { name: 'Ver brief' }).click()

    await expect(
      page.getByRole('dialog', { name: 'Brief de campaña' }),
    ).toBeVisible()
    await expect(page.getByText('Reseña honesta del serum Aura')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(
      page.getByRole('dialog', { name: 'Brief de campaña' }),
    ).toBeHidden()

    await auraCard.getByRole('button', { name: 'Postularme' }).click()
    await expect(page.getByRole('dialog', { name: 'Postularme' })).toBeVisible()
    await page
      .getByLabel('Mensaje')
      .fill('Me interesa participar porque mi audiencia busca skincare.')
    await page.getByRole('button', { name: 'Enviar postulación' }).click()

    await expect(page.getByRole('dialog', { name: 'Postularme' })).toBeHidden()
    await expect(
      page
        .getByRole('article', { name: 'Aura Skin Serum Launch' })
        .getByText('Postulación enviada'),
    ).toBeVisible()

    await secondPage.bringToFront()
    await expect(
      secondPageAuraCard.getByRole('button', { name: 'Postularme' }),
    ).toBeVisible()

    campaignBoardMocks.publishSubmittedApplicationToReadModel()
    await secondPage.getByRole('button', { name: 'Actualizar' }).click()

    await expect(
      secondPage
        .getByRole('article', { name: 'Aura Skin Serum Launch' })
        .getByText('Postulación enviada'),
    ).toBeVisible()

    await secondPage.close()
  })

  test('brand-authenticated user does not see the creator campaign board', async ({
    context,
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await installCampaignBoardMocks(context)

    await page.goto('/campaigns')

    await expect(page).toHaveURL(/\/campaigns/)
    await expect(
      page.getByRole('heading', { name: 'Campañas abiertas' }),
    ).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Nueva campaña/i }),
    ).toBeVisible()
  })
})
