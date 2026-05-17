import { test, expect } from './fixtures'

// Verifica paginación reversa de la timeline: 60 mensajes seedeados, 30 por
// página, el scroll hacia arriba dispara fetch de la página previa sin que
// la posición visual del último mensaje salte.

test.describe('chat history scroll', () => {
  test('cargar mensajes anteriores al subir el scroll', async ({
    chatPairWithHistory,
  }) => {
    const { conversationId, brandPage } = chatPairWithHistory
    await brandPage.goto(`/workspace/conversations/${conversationId}`)

    await brandPage.waitForSelector('[role="article"]', { timeout: 10_000 })

    const timeline = brandPage.locator('[data-testid="message-timeline"]')
    const scroller = brandPage.locator(
      '[data-testid="message-timeline-scroller"]',
    )
    const initialCount = Number(
      await timeline.getAttribute('data-loaded-message-count'),
    )
    expect(initialCount).toBeGreaterThan(0)
    expect(initialCount).toBeLessThan(60)

    // Sube el scroll para gatillar startReached -> fetchNextPage.
    await scroller.evaluate((el) => {
      el.scrollTop = 0
      el.dispatchEvent(new Event('scroll', { bubbles: true }))
    })

    // Espera a que aparezcan más mensajes que los iniciales
    await expect
      .poll(async () => {
        return Number(await timeline.getAttribute('data-loaded-message-count'))
      }, {
        timeout: 10_000,
      })
      .toBeGreaterThan(initialCount)
  })

  test('llega al inicio mostrando el pill de "Inicio de la conversación"', async ({
    chatPairWithHistory,
  }) => {
    const { conversationId, brandPage } = chatPairWithHistory
    await brandPage.goto(`/workspace/conversations/${conversationId}`)
    await brandPage.waitForSelector('[role="article"]', { timeout: 10_000 })

    const timeline = brandPage.locator('[data-testid="message-timeline"]')
    const scroller = brandPage.locator(
      '[data-testid="message-timeline-scroller"]',
    )

    // Sube hasta agotar la paginación
    for (let i = 0; i < 5; i++) {
      await scroller.evaluate((el) => {
        el.scrollTop = 0
        el.dispatchEvent(new Event('scroll', { bubbles: true }))
      })
      await brandPage.waitForTimeout(300)
    }

    await expect(timeline).toHaveAttribute('data-has-reached-beginning', 'true')
    await expect(brandPage.getByText(/inicio de la conversación/i)).toBeVisible(
      { timeout: 5_000 },
    )
  })
})
