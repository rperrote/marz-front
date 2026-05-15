import { test, expect } from './fixtures'

const campaignId = '00000000-0000-4000-8000-000000000101'
const brandWorkspaceId = '00000000-0000-4000-8000-000000000102'

type ConfigurationStep =
  | 'content_type'
  | 'pricing_model'
  | 'targeting'
  | 'bonus'
  | 'review'

type OperationalTargeting = {
  countries: string[]
  tiers: string[]
  follower_min: number | null
  follower_max: number | null
  genders: string[]
  age_min: number | null
  age_max: number | null
  interests: string[]
  content_languages: string[]
  source: 'brief_prefill' | 'manual'
  adjusted_from_brief: boolean
}

type BonusAmount =
  | { type: 'percentage'; percentage: number }
  | { type: 'fixed'; amount: string; currency: string }

type BonusConfig = {
  enabled: boolean
  speed_bonus: {
    enabled: boolean
    windows: Array<{
      window_id?: string
      window_hours: number
      bonus: BonusAmount
    }>
  }
  performance_bonus: {
    enabled: boolean
    milestones: Array<{
      milestone_id?: string
      views: number
      window_hours: number
      bonus: BonusAmount
    }>
  }
}

function makeConfiguration(state: {
  currentStep: ConfigurationStep
  completedSteps: ConfigurationStep[]
  configurationComplete: boolean
  configurationVersion: number
  status: 'draft' | 'active'
  contentType: 'influencer_posts' | 'ugc_videos' | null
  pricingModel: 'fixed_per_video' | 'per_views' | null
  operationalTargeting: OperationalTargeting
  bonusConfig: BonusConfig
}) {
  return {
    campaign_id: campaignId,
    brand_workspace_id: brandWorkspaceId,
    status: state.status,
    editable: true,
    block_reason: null,
    current_step: state.currentStep,
    completed_steps: state.completedSteps,
    configuration_complete: state.configurationComplete,
    configuration_version: state.configurationVersion,
    content_type: state.contentType,
    pricing_model: state.pricingModel,
    operational_targeting: state.operationalTargeting,
    bonus_config: state.bonusConfig,
    brief_summary: {
      confirmed_at: '2026-05-09T10:00:00Z',
      objective: 'brand_awareness',
      icp_description: null,
      icp_age_min: null,
      icp_age_max: null,
      icp_genders: [],
      icp_countries: [],
      icp_platforms: [],
      icp_interests: [],
      scoring_dimensions_count: 0,
      hard_filters_count: 0,
      disqualifiers_count: 0,
    },
    plan: {
      workspace_plan: 'paid',
      allows_campaign_board: true,
      allows_automatic_matching: true,
    },
    updated_at: '2026-05-09T10:00:00Z',
  }
}

test.describe('Campaign configuration wizard', () => {
  test('retoma desde lista una campaña draft con configuración pendiente', async ({
    page,
    onboardedBrandUser,
  }) => {
    await page.route(/\/v1\/campaigns(?:\?.*)?$/, (route) =>
      route.fulfill({
        json: {
          data: [
            {
              id: campaignId,
              name: 'Summer Glow 2026',
              status: 'draft',
              deadline: '2026-06-30T00:00:00Z',
              platforms: ['YouTube', 'Instagram'],
              creators_count: 0,
              budget_total_usd: '42000',
              videos_done: 0,
              videos_total: 0,
              configuration_complete: false,
              configuration_current_step: 'targeting',
            },
          ],
          status: 200,
        },
      }),
    )
    await page.route(`**/v1/campaigns/${campaignId}/configuration`, (route) =>
      route.fulfill({
        json: makeConfiguration({
          currentStep: 'targeting',
          completedSteps: ['content_type', 'pricing_model'],
          configurationComplete: false,
          configurationVersion: 3,
          status: 'draft',
          contentType: 'ugc_videos',
          pricingModel: 'per_views',
          operationalTargeting: {
            countries: ['AR'],
            tiers: ['emergent'],
            follower_min: null,
            follower_max: null,
            genders: [],
            age_min: null,
            age_max: null,
            interests: [],
            content_languages: ['es'],
            source: 'brief_prefill',
            adjusted_from_brief: false,
          },
          bonusConfig: {
            enabled: false,
            speed_bonus: { enabled: false, windows: [] },
            performance_bonus: { enabled: false, milestones: [] },
          },
        }),
      }),
    )

    await onboardedBrandUser.signIn(page)
    await page.goto('/campaigns')

    await expect(page.getByText('Configuración pendiente')).toBeVisible()
    await page.getByText('Retomar configuración').click()

    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/targeting$`),
    )
  })

  test('completa content type y pricing model preservando selección tras reload', async ({
    page,
    onboardedBrandUser,
  }) => {
    const initialOperationalTargeting: OperationalTargeting = {
      countries: ['AR', 'MX'],
      tiers: ['emergent'],
      follower_min: 10000,
      follower_max: 500000,
      genders: ['female'],
      age_min: 18,
      age_max: 35,
      interests: ['fitness'],
      content_languages: ['es'],
      source: 'brief_prefill',
      adjusted_from_brief: false,
    }
    const state = {
      currentStep: 'content_type' as ConfigurationStep,
      completedSteps: [] as ConfigurationStep[],
      configurationComplete: false,
      configurationVersion: 1,
      status: 'draft' as 'draft' | 'active',
      contentType: null as 'influencer_posts' | 'ugc_videos' | null,
      pricingModel: null as 'fixed_per_video' | 'per_views' | null,
      operationalTargeting: initialOperationalTargeting,
      bonusConfig: {
        enabled: false,
        speed_bonus: { enabled: false, windows: [] },
        performance_bonus: { enabled: false, milestones: [] },
      } as BonusConfig,
    }
    let briefEndpointWasMutated = false
    const activationReplay = {
      key: null as string | null,
      body: null as unknown,
      responseBody: null as { campaign_id: string; status: 'active' } | null,
      mutations: 0,
    }

    await page.route(`**/v1/campaigns/${campaignId}/configuration`, (route) =>
      route.fulfill({ json: makeConfiguration(state) }),
    )
    await page.route(`**/v1/campaigns/${campaignId}/brief`, (route) => {
      if (route.request().method() !== 'GET') {
        briefEndpointWasMutated = true
      }
      return route.fulfill({
        json: {
          campaign_id: campaignId,
          icp_age_min: 18,
          icp_age_max: 35,
          icp_genders: ['female'],
          icp_countries: ['AR', 'MX'],
          icp_platforms: ['instagram'],
          icp_interests: ['fitness'],
          scoring_dimensions: [],
          hard_filters: [],
          disqualifiers: [],
        },
      })
    })
    await page.route(
      `**/v1/campaigns/${campaignId}/configuration/content_type`,
      async (route) => {
        const body = route.request().postDataJSON() as {
          content_type: 'influencer_posts' | 'ugc_videos'
          configuration_version: number
        }
        expect(body).toEqual({
          content_type: 'ugc_videos',
          configuration_version: 1,
        })
        state.contentType = body.content_type
        state.currentStep = 'pricing_model'
        state.completedSteps = ['content_type']
        state.configurationComplete = false
        state.configurationVersion = 2
        await route.fulfill({ json: makeConfiguration(state) })
      },
    )
    await page.route(
      `**/v1/campaigns/${campaignId}/configuration/targeting`,
      async (route) => {
        const body = route.request().postDataJSON() as {
          operational_targeting: Partial<OperationalTargeting>
          configuration_version: number
        }
        expect(body).toEqual({
          operational_targeting: {
            tiers: ['emergent', 'consolidated'],
            follower_min: 20000,
          },
          configuration_version: 3,
        })
        state.operationalTargeting = {
          ...state.operationalTargeting,
          ...body.operational_targeting,
          source: 'manual',
          adjusted_from_brief: true,
        }
        state.currentStep = 'bonus'
        state.completedSteps = ['content_type', 'pricing_model', 'targeting']
        state.configurationComplete = false
        state.configurationVersion = 4
        await route.fulfill({ json: makeConfiguration(state) })
      },
    )
    await page.route(
      `**/v1/campaigns/${campaignId}/configuration/pricing_model`,
      async (route) => {
        const body = route.request().postDataJSON() as {
          pricing_model: 'fixed_per_video' | 'per_views'
          configuration_version: number
        }
        expect(body).toEqual({
          pricing_model: 'per_views',
          configuration_version: 2,
        })
        state.pricingModel = body.pricing_model
        state.currentStep = 'targeting'
        state.completedSteps = ['content_type', 'pricing_model']
        state.configurationComplete = false
        state.configurationVersion = 3
        await route.fulfill({ json: makeConfiguration(state) })
      },
    )
    await page.route(
      `**/v1/campaigns/${campaignId}/configuration/bonus`,
      async (route) => {
        const body = route.request().postDataJSON() as {
          bonus_config: BonusConfig
          configuration_version: number
        }
        expect(body).toEqual({
          bonus_config: {
            enabled: true,
            speed_bonus: {
              enabled: true,
              windows: [
                {
                  window_hours: 24,
                  bonus: { type: 'percentage', percentage: 25 },
                },
                {
                  window_hours: 72,
                  bonus: { type: 'fixed', amount: '10.00', currency: 'USD' },
                },
              ],
            },
            performance_bonus: {
              enabled: true,
              milestones: [
                {
                  views: 50000,
                  window_hours: 168,
                  bonus: { type: 'percentage', percentage: 15 },
                },
                {
                  views: 200000,
                  window_hours: 336,
                  bonus: { type: 'fixed', amount: '100.00', currency: 'USD' },
                },
              ],
            },
          },
          configuration_version: 4,
        })
        state.bonusConfig = {
          enabled: true,
          speed_bonus: {
            enabled: true,
            windows: body.bonus_config.speed_bonus.windows.map(
              (window, index) => ({
                ...window,
                window_id: `00000000-0000-4000-8000-00000000030${String(
                  index + 1,
                )}`,
              }),
            ),
          },
          performance_bonus: {
            enabled: true,
            milestones: body.bonus_config.performance_bonus.milestones.map(
              (milestone, index) => ({
                ...milestone,
                milestone_id: `00000000-0000-4000-8000-00000000040${String(
                  index + 1,
                )}`,
              }),
            ),
          },
        }
        state.currentStep = 'review'
        state.completedSteps = [
          'content_type',
          'pricing_model',
          'targeting',
          'bonus',
          'review',
        ]
        state.configurationComplete = true
        state.configurationVersion = 5
        await route.fulfill({ json: makeConfiguration(state) })
      },
    )
    await page.route(
      `**/v1/campaigns/${campaignId}/configuration/activate`,
      async (route) => {
        const key = route.request().headers()['idempotency-key']
        const body = route.request().postDataJSON() as {
          configuration_version: number
        }

        expect(key).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        )
        expect(body).toEqual({ configuration_version: 5 })

        if (activationReplay.key === key) {
          expect(body).toEqual(activationReplay.body)

          await route.fulfill({
            headers: { 'access-control-allow-origin': '*' },
            json: activationReplay.responseBody,
          })
          return
        } else {
          activationReplay.key = key ?? null
          activationReplay.body = body
          activationReplay.mutations += 1
          state.status = 'active'
        }

        activationReplay.responseBody = {
          campaign_id: campaignId,
          status: state.status,
        }
        await route.fulfill({
          headers: { 'access-control-allow-origin': '*' },
          json: activationReplay.responseBody,
        })
      },
    )

    await page.addInitScript(() => {
      Object.defineProperty(crypto, 'randomUUID', {
        value: () => '11111111-1111-4111-8111-111111111111',
      })
    })

    await onboardedBrandUser.signIn(page)
    await page.goto(`/campaigns/${campaignId}/configuration/content_type`)

    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/content_type$`),
    )
    await page.getByRole('button', { name: /ugc videos/i }).click()
    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/pricing_model$`),
    )

    await page.reload()
    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/pricing_model$`),
    )
    await page.getByRole('button', { name: /atrás/i }).click()
    await expect(
      page.getByRole('button', { name: /ugc videos/i }),
    ).toHaveAttribute('aria-pressed', 'true')

    await page.goto(`/campaigns/${campaignId}/configuration/pricing_model`)
    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/pricing_model$`),
    )

    await page.getByRole('button', { name: /per views/i }).click()
    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/targeting$`),
    )

    await expect(
      page.getByRole('button', { name: 'Argentina' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Consolidado' }).click()
    await page.getByLabel('Seguidores mínimos').fill('20000')
    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/bonus$`),
    )
    await page.getByRole('switch', { name: 'Activar bonus de pago' }).click()
    await page.getByRole('button', { name: /speed bonus/i }).click()
    await page.getByRole('button', { name: /performance bonus/i }).click()

    await page.getByRole('button', { name: 'Agregar ventana' }).click()
    await page.getByLabel('Horas ventana 1').fill('24')
    await page.getByLabel('Porcentaje de Speed 1').fill('25')
    await page.getByLabel('Horas ventana 2').fill('72')
    await page
      .getByRole('group', { name: 'Tipo de bonus para Speed 2' })
      .getByRole('radio', { name: 'Monto fijo en USD' })
      .click()
    await page.getByLabel('Monto de Speed 2 en USD').fill('10.00')

    await page.getByRole('button', { name: 'Agregar milestone' }).click()
    await page.getByLabel('Views milestone 1').fill('50000')
    await page.getByLabel('Horas milestone 1').fill('168')
    await page.getByLabel('Porcentaje de Milestone 1').fill('15')
    await page.getByLabel('Views milestone 2').fill('200000')
    await page.getByLabel('Horas milestone 2').fill('336')
    await page
      .getByRole('group', { name: 'Tipo de bonus para Milestone 2' })
      .getByRole('radio', { name: 'Monto fijo en USD' })
      .click()
    await page.getByLabel('Monto de Milestone 2 en USD').fill('100.00')

    await page.getByRole('button', { name: /continuar/i }).click()

    await expect(page).toHaveURL(
      new RegExp(`/campaigns/${campaignId}/configuration/review$`),
    )
    await expect.poll(() => briefEndpointWasMutated).toBe(false)

    await page.goto(`/campaigns/${campaignId}/configuration/bonus`)
    await expect(page.getByLabel('Horas ventana 1')).toHaveValue('24')
    await expect(page.getByLabel('Horas ventana 2')).toHaveValue('72')
    await expect(page.getByLabel('Views milestone 1')).toHaveValue('50000')
    await expect(page.getByLabel('Views milestone 2')).toHaveValue('200000')
    expect(state.bonusConfig.speed_bonus.windows[0]?.window_id).toBe(
      '00000000-0000-4000-8000-000000000301',
    )
    expect(
      state.bonusConfig.performance_bonus.milestones[1]?.milestone_id,
    ).toBe('00000000-0000-4000-8000-000000000402')

    await page.goto(`/campaigns/${campaignId}/configuration/targeting`)
    await expect(
      page.getByRole('button', { name: 'Consolidado' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByLabel('Seguidores mínimos')).toHaveValue('20000')

    await page.goto(`/campaigns/${campaignId}/configuration/review`)
    await page.getByRole('button', { name: 'Activar campaña' }).click()
    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignId}$`))
    expect(state.status).toBe('active')
    if (activationReplay.key === null) {
      throw new Error('Activation idempotency key was not captured')
    }
    const replayKey = activationReplay.key

    await page.goto(`/campaigns/${campaignId}/configuration/review`)
    await page.getByRole('button', { name: 'Activar campaña' }).click()
    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignId}$`))
    expect(activationReplay.key).toBe(replayKey)
    expect(activationReplay.mutations).toBe(1)
    expect(state.status).toBe('active')
  })
})
