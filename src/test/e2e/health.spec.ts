import { expect, test } from '@playwright/test'

test('health renderiza payload con status ok', async ({ page }) => {
  const res = await page.goto('/health')
  expect(res?.status()).toBe(200)

  const raw = await page.locator('pre').textContent()
  expect(raw).not.toBeNull()
  const body = JSON.parse(raw ?? '')

  expect(body.status).toBe('ok')
  expect(typeof body.uptime_sec).toBe('number')
})
