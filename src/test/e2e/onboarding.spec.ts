import { test, expect } from './fixtures'

test.describe('Onboarding E2E', () => {
  test('brand onboarding_pending ve el wizard', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/onboarding/brand')

    await expect(page.getByText(/Paso 1 de/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Continuar/i })).toBeVisible()
  })

  test('creator onboarding_pending ve el wizard de creator', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator')

    await expect(page.getByText(/Paso 1 de/)).toBeVisible()
  })

  test('brand onboarded es redirigido de /onboarding/brand a /campaigns', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/onboarding/brand')

    await expect(page).toHaveURL(/\/campaigns/)
  })

  test('creator onboarded es redirigido de /onboarding/creator a /offers', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/onboarding/creator')

    await expect(page).toHaveURL(/\/offers/)
  })

  test('kind_pending ve el selector de kind', async ({ page, testUser }) => {
    await testUser.setOnboardingState('kind_pending')
    await testUser.signIn(page)
    await page.goto('/auth/kind')

    await expect(
      page.getByRole('heading', { name: /Qué te trae por acá/i }),
    ).toBeVisible()
  })
})
