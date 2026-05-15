import { test, expect } from '../fixtures'

// Reproduces the bug where the OfferSent system_event arrives via WS but the
// timeline does not render the offer card (OfferTimelineEntry returns null
// when offerSnapshotSchema fails to parse the payload).
//
// Flow:
// 1. seed_offer_ready creates a campaign + accepted application + open
//    conversation between brand and creator.
// 2. Brand calls POST /v1/offers from the authenticated browser context.
// 3. Creator (separate browser) is sitting in the conversation and must see
//    the "Offer sent" card appear in the timeline via WS push.

test.describe('OfferSent system_event rendering', () => {
  test('creator sees offer card after brand sends single offer', async ({
    chatPairOfferReady,
  }) => {
    const {
      conversationId,
      brandWorkspaceId,
      campaignId,
      brandPage,
      creatorPage,
    } = chatPairOfferReady

    expect(campaignId, 'seed_offer_ready must return campaign_id').toBeDefined()

    const route = `/workspace/conversations/${conversationId}`

    await brandPage.goto(route)
    await creatorPage.goto(route)
    await brandPage.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })
    await creatorPage.waitForSelector('[data-testid="message-timeline"]', {
      timeout: 10_000,
    })

    const apiBaseUrl = process.env.VITE_API_URL ?? 'http://marz-dev.test'
    const clerkToken = await brandPage.evaluate(async () => {
      // Clerk attaches a global on window when the SDK loads. The session token
      // is what marz-api validates via `Authorization: Bearer <token>`.
      const clerk = (
        window as unknown as {
          Clerk?: { session?: { getToken: () => Promise<string | null> } }
        }
      ).Clerk
      return (await clerk?.session?.getToken()) ?? null
    })
    expect(clerkToken, 'brand must have a Clerk session token').toBeTruthy()

    const response = await brandPage.request.post(`${apiBaseUrl}/v1/offers`, {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'X-Brand-Workspace-Id': brandWorkspaceId,
      },
      data: {
        type: 'single',
        campaign_id: campaignId,
        conversation_id: conversationId,
        amount: '500.00',
        deadline: '2026-12-31T00:00:00Z',
        description: 'E2E single offer',
        deliverable: {
          platform: 'youtube',
          format: 'yt_short',
        },
      },
    })

    expect(
      response.ok(),
      `POST /v1/offers failed: ${response.status()} ${await response.text()}`,
    ).toBe(true)

    const creatorCard = creatorPage
      .getByRole('article', {
        name: /oferta de campaña recibida|campaign offer received/i,
      })
      .first()
    await expect(creatorCard).toBeVisible({ timeout: 10_000 })
    await expect(creatorCard).toContainText('E2E OfferSent Campaign')

    // Brand timeline shows the offer authored by self with the same campaign
    // name (works regardless of card variant — sent/accepted/etc).
    const brandCard = brandPage
      .locator('[role="article"]', { hasText: 'E2E OfferSent Campaign' })
      .first()
    await expect(brandCard).toBeVisible({ timeout: 10_000 })
  })
})
