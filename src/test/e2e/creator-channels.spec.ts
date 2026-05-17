import type { Page } from '@playwright/test'

import { test, expect } from './fixtures'

const platformHeader = /Instagram|TikTok|YouTube/

function channelHeaders(page: Page) {
  return page.getByRole('button').filter({
    hasText: platformHeader,
  })
}

async function addChannel(page: Page) {
  const addButton = page.getByRole('button', { name: /Agregar canal/i })
  const headers = channelHeaders(page)
  const countBefore = await headers.count()
  await addButton.click()
  await expect(headers).toHaveCount(countBefore + 1)
}

async function pickFirstOption(page: Page) {
  await page.keyboard.press('ArrowDown')
  await page.getByRole('option').first().click()
}

/**
 * Reproduces three bugs reported on the C7 channels screen:
 *
 * 1. With many channels, the wizard <main> uses justify-center over
 *    overflow-y-auto, so when content exceeds the viewport the top of the
 *    list is clipped above the scroll origin and becomes unreachable.
 * 2. When a rate card has no amount, the field shows no destructive styling.
 * 3. "Continuar" must be disabled if any rate card is missing its amount.
 */
test.describe('Creator onboarding — channels screen', () => {
  test.beforeEach(async ({ page, creatorOnboardingUser }) => {
    await creatorOnboardingUser.signIn(page)
    await page.goto('/onboarding/creator/channels')
    await expect(
      page.getByRole('button', { name: /Agregar canal/i }),
    ).toBeVisible()
  })

  test('first channel header remains reachable via scroll when content overflows', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 400 })

    const addButton = page.getByRole('button', { name: /Agregar canal/i })
    // 3 platforms max → 3 channels.
    await addChannel(page)
    await addChannel(page)
    await addChannel(page)
    await expect(addButton).toBeDisabled()

    // Scroll the wizard scroll container to the top.
    await page.evaluate(() => {
      const main = document.querySelector('main')
      if (main) main.scrollTop = 0
    })

    // The first channel header must be visible at scrollTop=0.
    const firstHeader = channelHeaders(page).first()
    await expect(firstHeader).toBeInViewport()
  })

  test('Agregar canal disables once all 3 platforms are taken', async ({
    page,
  }) => {
    const addButton = page.getByRole('button', { name: /Agregar canal/i })
    await addChannel(page)
    await addChannel(page)
    await addChannel(page)
    await expect(addButton).toBeDisabled()

    // All 3 distinct platforms must be present.
    const headers = channelHeaders(page)
    await expect(headers).toContainText(['Instagram', 'TikTok', 'YouTube'])
  })

  test('rate card with empty amount marks the input as invalid', async ({
    page,
  }) => {
    await addChannel(page)
    const firstHeader = page.getByRole('button', { name: /Instagram/ }).first()
    if ((await firstHeader.getAttribute('aria-expanded')) !== 'true') {
      await firstHeader.click()
    }
    await expect(firstHeader).toHaveAttribute('aria-expanded', 'true')

    await page.getByText('Agregar tarifa...').first().click()
    await pickFirstOption(page)

    const amount = page.getByPlaceholder('0.00').first()
    await expect(amount).toBeVisible()
    await expect(amount).toHaveAttribute('aria-invalid', 'true')
  })

  test('Continuar is disabled while any channel is missing its handle', async ({
    page,
  }) => {
    await addChannel(page)

    const continueBtn = page.getByRole('button', { name: /Continuar/i })
    await expect(continueBtn).toBeDisabled()

    await page.getByPlaceholder('tu_handle').fill('mi_handle')
    await expect(continueBtn).toBeEnabled()
  })

  test('Continuar is disabled while any rate card is missing its amount', async ({
    page,
  }) => {
    await addChannel(page)

    // Fill handle so primary + handle are valid.
    await page.getByPlaceholder('tu_handle').fill('mi_handle')

    // Add a rate card without amount.
    await page.getByText('Agregar tarifa...').first().click()
    await pickFirstOption(page)

    const continueBtn = page.getByRole('button', { name: /Continuar/i })
    await expect(continueBtn).toBeDisabled()

    // Fill the amount → should re-enable Continuar.
    await page.getByPlaceholder('0.00').first().fill('100')
    await expect(continueBtn).toBeEnabled()
  })
})
