import type { BrowserContext, Page, Route } from '@playwright/test'

import type {
  CreatorCampaignBoardApplication,
  CreatorCampaignBoardCard,
  CreatorCampaignBoardDetailResponse,
  CreatorCampaignBoardResponse,
  ListCreatorCampaignBoardParams,
  SubmitCampaignApplicationResponse,
} from '#/shared/api/generated/model'

const applicationId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const submittedAt = '2026-05-09T10:30:00.000Z'
const campaignBoardPlatforms = ['instagram', 'tiktok', 'youtube'] as const
type CampaignBoardPlatform = (typeof campaignBoardPlatforms)[number]

export const campaignBoardIds = {
  aura: '11111111-1111-4111-8111-111111111111',
  glow: '22222222-2222-4222-8222-222222222222',
  fit: '33333333-3333-4333-8333-333333333333',
  coffee: '44444444-4444-4444-8444-444444444444',
} as const

export interface CampaignBoardMockState {
  publishSubmittedApplicationToReadModel: () => void
}

function submittedApplication(): CreatorCampaignBoardApplication {
  return {
    status: 'submitted',
    application_id: applicationId,
    submitted_at: submittedAt,
    can_apply: false,
  }
}

function openApplication(): CreatorCampaignBoardApplication {
  return {
    status: 'none',
    application_id: null,
    submitted_at: null,
    can_apply: true,
  }
}

function makeCard(params: {
  campaignId: string
  brandName: string
  brandVertical: string
  campaignName: string
  description: string
  deadline: string
  feeMin: string
  feeMax: string
  niches: string[]
  interests: string[]
  platforms: string[]
  deliverables: string[]
  matchScore: number
  publishedAt: string
  application?: CreatorCampaignBoardApplication
}): CreatorCampaignBoardCard {
  return {
    campaign_id: params.campaignId,
    brand: {
      brand_workspace_id: `${params.campaignId.slice(0, 8)}-bbbb-4bbb-8bbb-bbbbbbbbbbbb`,
      name: params.brandName,
      logo_url: null,
      avatar_initials: params.brandName
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      vertical: params.brandVertical,
    },
    campaign: {
      name: params.campaignName,
      objective: 'brand_awareness',
      description_preview: params.description,
      deadline: params.deadline,
      deliverables: params.deliverables.map((format, index) => ({
        platform: params.platforms[index] ?? params.platforms[0] ?? 'instagram',
        format,
        quantity: index + 1,
        description: `${format} para ${params.campaignName}`,
      })),
    },
    economics: {
      fee_model: 'fixed_per_video',
      fee_min_amount: params.feeMin,
      fee_max_amount: params.feeMax,
      fee_label: `USD ${params.feeMin} - ${params.feeMax}`,
    },
    targeting: {
      niches: params.niches,
      interests: params.interests,
      platforms: params.platforms,
      deliverables: params.deliverables,
      fee_min: params.feeMin,
      fee_max: params.feeMax,
    },
    match: {
      score: params.matchScore,
      score_raw: `${params.matchScore}.00`,
      band:
        params.matchScore >= 85
          ? 'high'
          : params.matchScore >= 60
            ? 'medium'
            : 'low',
      recommended: params.matchScore >= 80,
      hard_filters_passed: true,
      profile_complete: true,
      positive_reasons: ['Perfil alineado con el brief'],
      mismatch_reasons: [],
    },
    application: params.application ?? openApplication(),
    published_at: params.publishedAt,
  }
}

function makeCards(readModelHasSubmittedApplication: boolean) {
  const auraApplication = readModelHasSubmittedApplication
    ? submittedApplication()
    : openApplication()

  return [
    makeCard({
      campaignId: campaignBoardIds.glow,
      brandName: 'Glow Lab',
      brandVertical: 'beauty',
      campaignName: 'Glow Lab Routine',
      description: 'Rutina de skincare para piel sensible.',
      deadline: '2026-06-04',
      feeMin: '350',
      feeMax: '450',
      niches: ['beauty'],
      interests: ['skincare'],
      platforms: ['instagram'],
      deliverables: ['reel'],
      matchScore: 96,
      publishedAt: '2026-05-07T10:00:00.000Z',
    }),
    makeCard({
      campaignId: campaignBoardIds.aura,
      brandName: 'Aura Skin',
      brandVertical: 'beauty',
      campaignName: 'Aura Skin Serum Launch',
      description: 'Lanzamiento de serum con foco en review honesta.',
      deadline: '2026-06-10',
      feeMin: '800',
      feeMax: '900',
      niches: ['beauty'],
      interests: ['skincare', 'wellness'],
      platforms: ['instagram', 'tiktok'],
      deliverables: ['reel', 'short_form'],
      matchScore: 88,
      publishedAt: '2026-05-08T10:00:00.000Z',
      application: auraApplication,
    }),
    makeCard({
      campaignId: campaignBoardIds.fit,
      brandName: 'Fit Fuel',
      brandVertical: 'fitness',
      campaignName: 'Fit Fuel Creators',
      description: 'Contenido para creators de entrenamiento funcional.',
      deadline: '2026-05-30',
      feeMin: '600',
      feeMax: '700',
      niches: ['fitness'],
      interests: ['wellness'],
      platforms: ['tiktok'],
      deliverables: ['short_form'],
      matchScore: 82,
      publishedAt: '2026-05-06T10:00:00.000Z',
    }),
    makeCard({
      campaignId: campaignBoardIds.coffee,
      brandName: 'Urban Coffee',
      brandVertical: 'food',
      campaignName: 'Urban Coffee Morning',
      description: 'Historias de café de especialidad en rutina diaria.',
      deadline: '2026-05-22',
      feeMin: '250',
      feeMax: '300',
      niches: ['food'],
      interests: ['lifestyle'],
      platforms: ['youtube'],
      deliverables: ['long_form'],
      matchScore: 71,
      publishedAt: '2026-05-05T10:00:00.000Z',
    }),
  ]
}

function makeBoardResponse(
  search: ListCreatorCampaignBoardParams,
  readModelHasSubmittedApplication: boolean,
): CreatorCampaignBoardResponse {
  const filteredCards = makeCards(readModelHasSubmittedApplication)
    .filter(
      (card) =>
        includesEvery(card.targeting.niches, search.niches) &&
        includesEvery(card.targeting.interests, search.interests) &&
        includesEvery(card.targeting.platforms, search.platforms) &&
        includesEvery(card.targeting.deliverables, search.deliverables),
    )
    .sort((left, right) => compareCards(left, right, search.sort))

  return {
    data: filteredCards,
    counts: {
      total_visible: makeCards(readModelHasSubmittedApplication).length,
      recommended: filteredCards.filter((card) => card.match.recommended)
        .length,
      matching_filters: filteredCards.length,
    },
    filters: {
      applied: {
        q: search.q,
        niches: search.niches,
        interests: search.interests,
        platforms: search.platforms,
        deliverables: search.deliverables,
        fee_min_amount: search.fee_min_amount,
        fee_max_amount: search.fee_max_amount,
        min_match_score: search.min_match_score,
        recommended_only: search.recommended_only ?? false,
      },
      available: {
        niches: ['beauty', 'fitness', 'food'],
        interests: ['skincare', 'wellness', 'lifestyle'],
        platforms: ['instagram', 'tiktok', 'youtube'],
        deliverables: ['reel', 'short_form', 'long_form'],
        match_score_min: 0,
        match_score_max: 100,
      },
    },
    next_cursor: null,
    generated_at: '2026-05-09T10:00:00.000Z',
  }
}

function makeDetailResponse(card: CreatorCampaignBoardCard) {
  return {
    card,
    brief: {
      description:
        'Reseña honesta del serum Aura con foco en textura, rutina y resultados esperados.',
      tone: 'Cercano, experto y transparente.',
      key_messages: ['Serum liviano', 'Apto para rutina diaria'],
      do_list: ['Mostrar textura real', 'Hablar de rutina completa'],
      dont_list: ['Prometer resultados médicos'],
      icp: {
        description: 'Personas interesadas en skincare consciente.',
        age_min: 21,
        age_max: 38,
        genders: ['female', 'non_binary'],
        countries: ['AR', 'MX'],
        platforms: ['instagram', 'tiktok'],
        interests: ['skincare', 'wellness'],
      },
      scoring_dimensions: [
        {
          name: 'Credibilidad skincare',
          description: 'Experiencia comunicando cuidado de piel.',
          weight_pct: 60,
          positive_signals: ['Reviews previas', 'Contenido educativo'],
          negative_signals: ['Promesas exageradas'],
        },
      ],
      disqualifiers: ['Contenido médico no respaldado'],
    },
    targeting: {
      countries: ['AR', 'MX'],
      interests: ['skincare', 'wellness'],
      content_languages: ['es'],
      platforms: ['instagram', 'tiktok'],
      age_min: 21,
      age_max: 38,
    },
    commercial: {
      fee_min_amount: '800',
      fee_max_amount: '900',
      fee_label: 'USD 800 - 900',
      pricing_notes: 'Pago fijo por deliverable aprobado.',
    },
    application: card.application,
    generated_at: '2026-05-09T10:00:00.000Z',
  } satisfies CreatorCampaignBoardDetailResponse
}

function makeSubmitResponse(): SubmitCampaignApplicationResponse {
  return {
    application: {
      application_id: applicationId,
      campaign_id: campaignBoardIds.aura,
      status: 'submitted',
      message: 'Me interesa participar porque mi audiencia busca skincare.',
      submitted_at: submittedAt,
    },
    idempotent_replay: false,
  }
}

function includesEvery(values: string[], selected: string[] | undefined) {
  if (selected === undefined || selected.length === 0) return true
  return selected.every((value) => values.includes(value))
}

function compareCards(
  left: CreatorCampaignBoardCard,
  right: CreatorCampaignBoardCard,
  sort: ListCreatorCampaignBoardParams['sort'] = 'match_score_desc',
) {
  if (sort === 'fee_desc') {
    return getFeeMax(right) - getFeeMax(left)
  }

  if (sort === 'deadline_asc') {
    return (
      getDateValue(left.campaign.deadline) -
      getDateValue(right.campaign.deadline)
    )
  }

  if (sort === 'recent_desc') {
    return getDateValue(right.published_at) - getDateValue(left.published_at)
  }

  return right.match.score - left.match.score
}

function getFeeMax(card: CreatorCampaignBoardCard) {
  const value = card.economics.fee_max_amount
  return typeof value === 'string' ? Number(value) : 0
}

function getDateValue(value: unknown) {
  return typeof value === 'string' ? new Date(value).getTime() : 0
}

function parseSearchFromPayloadText(payloadText: string) {
  return {
    niches: selectedValues(payloadText, ['beauty', 'fitness', 'food']),
    interests: selectedValues(payloadText, [
      'skincare',
      'wellness',
      'lifestyle',
    ]),
    platforms: selectedPlatformValues(payloadText),
    deliverables: selectedValues(payloadText, [
      'reel',
      'short_form',
      'long_form',
    ]),
    recommended_only: payloadText.includes('recommended_only')
      ? payloadText.includes('true')
      : false,
    sort: payloadText.includes('fee_desc')
      ? 'fee_desc'
      : payloadText.includes('deadline_asc')
        ? 'deadline_asc'
        : payloadText.includes('recent_desc')
          ? 'recent_desc'
          : 'match_score_desc',
  } satisfies ListCreatorCampaignBoardParams
}

function selectedValues(payloadText: string, values: string[]) {
  const selected = values.filter((value) => payloadText.includes(value))
  return selected.length > 0 ? selected : undefined
}

function selectedPlatformValues(payloadText: string) {
  const selected = campaignBoardPlatforms.filter((value) =>
    payloadText.includes(value),
  )
  return selected.length > 0
    ? selected.map((value): CampaignBoardPlatform => value)
    : undefined
}

function getPayloadText(route: Route) {
  const url = new URL(route.request().url())
  return `${url.searchParams.get('payload') ?? ''} ${route.request().postData() ?? ''}`
}

function isCampaignApplicationSubmitPayload(payloadText: string) {
  return (
    payloadText.includes('campaignId') &&
    payloadText.includes('idempotencyKey') &&
    payloadText.includes('message')
  )
}

function isCampaignBoardDetailPayload(payloadText: string) {
  return Object.values(campaignBoardIds).some((campaignId) =>
    payloadText.includes(campaignId),
  )
}

function findCardOrFallback(
  campaignId: string,
  readModelHasSubmittedApplication: boolean,
) {
  const cards = makeCards(readModelHasSubmittedApplication)
  const fallbackCard = cards[0]
  if (!fallbackCard) {
    throw new Error('Campaign board mock has no cards')
  }

  return cards.find((card) => card.campaign_id === campaignId) ?? fallbackCard
}

function findCampaignId(payloadText: string) {
  return Object.values(campaignBoardIds).find((campaignId) =>
    payloadText.includes(campaignId),
  )
}

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ result: body }),
  })
}

export async function installCampaignBoardMocks(
  context: BrowserContext,
): Promise<CampaignBoardMockState> {
  let readModelHasSubmittedApplication = false
  const pagesWithInlineSubmittedApplication = new WeakSet<Page>()

  await context.route('**/*', async (route) => {
    const request = route.request()
    if (request.headers()['x-tsr-serverfn'] !== 'true') {
      await route.fallback()
      return
    }

    const payloadText = getPayloadText(route)

    if (
      request.method() === 'POST' &&
      isCampaignApplicationSubmitPayload(payloadText)
    ) {
      pagesWithInlineSubmittedApplication.add(route.request().frame().page())
      await fulfillJson(route, makeSubmitResponse())
      return
    }

    const pageHasSubmittedApplication =
      readModelHasSubmittedApplication ||
      pagesWithInlineSubmittedApplication.has(route.request().frame().page())
    if (isCampaignBoardDetailPayload(payloadText)) {
      const campaignId = findCampaignId(payloadText) ?? campaignBoardIds.aura
      await fulfillJson(
        route,
        makeDetailResponse(
          findCardOrFallback(campaignId, pageHasSubmittedApplication),
        ),
      )
      return
    }

    await fulfillJson(
      route,
      makeBoardResponse(
        parseSearchFromPayloadText(payloadText),
        pageHasSubmittedApplication,
      ),
    )
  })

  return {
    publishSubmittedApplicationToReadModel: () => {
      readModelHasSubmittedApplication = true
    },
  }
}

export async function gotoCreatorCampaignBoard(page: Page) {
  await page.goto('/discover/campaigns')
}
