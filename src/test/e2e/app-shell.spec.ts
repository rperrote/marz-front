import type { Page } from '@playwright/test'

import { test, expect } from './fixtures'

const disabledBrandItems = ['Home', 'Campaigns', 'Creators', 'Analytics']

async function expectDisabledItemDoesNotNavigate(page: Page, name: string) {
  const urlBefore = page.url()
  const item = page.getByRole('button', { name })

  await item.focus()
  await expect(page.getByRole('tooltip')).toHaveText('Próximamente')
  await item.click()

  await expect(page).toHaveURL(urlBefore)
}

test.describe('App shell desktop', () => {
  test('brand onboarded sees brand sidebar and navigates to workspace and inbox', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/campaigns')

    await expect(page).toHaveURL(/\/campaigns/)
    await expect(page.getByTestId('app-sidebar')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Workspace' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Creators' })).toBeVisible()

    await page.getByRole('link', { name: 'Workspace' }).click()
    await expect(page).toHaveURL(/\/workspace/)

    await page.getByRole('link', { name: 'Inbox' }).click()
    await expect(page).toHaveURL(/\/inbox/)

    for (const item of disabledBrandItems) {
      await expectDisabledItemDoesNotNavigate(page, item)
    }
  })

  test('creator onboarded sees creator sidebar without brand-only items', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/offers')

    await expect(page).toHaveURL(/\/offers/)
    await expect(page.getByTestId('app-sidebar')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Workspace' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Campaigns' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Creators' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Workspace' }).click()
    await expect(page).toHaveURL(/\/workspace/)

    await page.getByRole('link', { name: 'Inbox' }).click()
    await expect(page).toHaveURL(/\/inbox/)

    await expectDisabledItemDoesNotNavigate(page, 'Home')
    await expectDisabledItemDoesNotNavigate(page, 'Analytics')
  })

  test('brand entering creator routes redirects to workspace', async ({
    page,
    onboardedBrandUser,
  }) => {
    await onboardedBrandUser.signIn(page)
    await page.goto('/offers')
    await expect(page).toHaveURL(/\/workspace/)
  })

  test('creator entering brand routes redirects to workspace', async ({
    page,
    onboardedCreatorUser,
  }) => {
    await onboardedCreatorUser.signIn(page)
    await page.goto('/campaigns')
    await expect(page).toHaveURL(/\/workspace/)
  })

  test('brand onboarding user redirects to brand onboarding shell', async ({
    page,
    brandOnboardingUser,
  }) => {
    await brandOnboardingUser.signIn(page)
    await page.goto('/workspace')
    await expect(page).toHaveURL(/\/onboarding\/brand/)
  })

  test('creator onboarding user redirects to creator onboarding shell', async ({
    page,
    creatorOnboardingUser,
  }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/workspace')
    await expect(page).toHaveURL(/\/onboarding\/creator/)
  })

  test('disabled shell actions do not emit analytics debug events', async ({
    page,
    onboardedBrandUser,
  }) => {
    const analyticsEvents: string[] = []
    page.on('console', (msg) => {
      if (msg.text().startsWith('[analytics]')) {
        analyticsEvents.push(msg.text())
      }
    })

    await onboardedBrandUser.signIn(page)
    await page.goto('/campaigns')
    await expectDisabledItemDoesNotNavigate(page, 'Home')
    await page.getByRole('link', { name: 'Inbox' }).click()
    await expect(page).toHaveURL(/\/inbox/)

    expect(analyticsEvents).toHaveLength(0)
  })
})
