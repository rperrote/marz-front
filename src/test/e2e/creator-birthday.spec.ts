import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

/**
 * C11 birthday screen uses Radix Select (shadcn). selectOption() can't drive
 * those — we click the trigger and pick the option from the listbox.
 */
async function pickOption(page: Page, label: RegExp, optionName: string) {
  const trigger = page.getByRole('combobox', { name: label })
  await trigger.click()
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.getByRole('option', { name: optionName, exact: true }).click()
}

test.describe('Creator onboarding — birthday screen', () => {
  test.beforeEach(async ({ page, creatorOnboardingUser }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/birthday')
    await expect(
      page.getByRole('heading', { name: /¿Cuándo es tu cumpleaños\?/i }),
    ).toBeVisible()
  })

  test('selecting day, then month, then year keeps all three values', async ({
    page,
  }) => {
    const dayTrigger = page.getByLabel(/Día/i)
    const monthTrigger = page.getByLabel(/Mes/i)
    const yearTrigger = page.getByLabel(/Año/i)

    await pickOption(page, /Día/i, '5')
    await expect(dayTrigger).toContainText('5')

    await pickOption(page, /Mes/i, 'Marzo')
    await expect(dayTrigger).toContainText('5')
    await expect(monthTrigger).toContainText('Marzo')

    const year = `${new Date().getFullYear() - 25}`
    await pickOption(page, /Año/i, year)

    await expect(dayTrigger).toContainText('5')
    await expect(monthTrigger).toContainText('Marzo')
    await expect(yearTrigger).toContainText(year)

    await expect(page.getByRole('button', { name: /Continuar/i })).toBeEnabled()
  })

  test('selecting in month → day → year order also keeps all values', async ({
    page,
  }) => {
    const dayTrigger = page.getByLabel(/Día/i)
    const monthTrigger = page.getByLabel(/Mes/i)
    const yearTrigger = page.getByLabel(/Año/i)

    await pickOption(page, /Mes/i, 'Julio')
    await expect(monthTrigger).toContainText('Julio')

    await pickOption(page, /Día/i, '12')
    await expect(monthTrigger).toContainText('Julio')
    await expect(dayTrigger).toContainText('12')

    const year = `${new Date().getFullYear() - 30}`
    await pickOption(page, /Año/i, year)

    await expect(dayTrigger).toContainText('12')
    await expect(monthTrigger).toContainText('Julio')
    await expect(yearTrigger).toContainText(year)

    await expect(page.getByRole('button', { name: /Continuar/i })).toBeEnabled()
  })

  test('Continuar enables once a complete valid date is selected', async ({
    page,
  }) => {
    const continueBtn = page.getByRole('button', { name: /Continuar/i })

    await expect(continueBtn).toBeDisabled()

    await pickOption(page, /Día/i, '16')
    await pickOption(page, /Mes/i, 'Junio')
    await pickOption(page, /Año/i, `${new Date().getFullYear() - 25}`)

    await expect(continueBtn).toBeEnabled()
  })
})
