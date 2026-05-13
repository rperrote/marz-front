import { createFileRoute, redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { CampaignConfigurationStepSlot } from '#/features/campaigns/configuration/CampaignConfigurationWizard'
import {
  campaignConfigurationQueryOptions,
  campaignDetailSearchDefaults,
  isCampaignConfigurationStep,
} from '#/features/campaigns/configuration/hooks'

type ConfigurationQueryClient = QueryClient

export async function loadCampaignConfigurationStepRoute({
  campaignId,
  step,
  queryClient,
}: {
  campaignId: string
  step: string
  queryClient: ConfigurationQueryClient
}) {
  const config = await queryClient.ensureQueryData(
    campaignConfigurationQueryOptions(campaignId),
  )

  if (!isCampaignConfigurationStep(step)) {
    throw redirect({
      to: '/campaigns/$campaignId/configuration/$step',
      params: {
        campaignId,
        step: config.current_step,
      },
      search: campaignDetailSearchDefaults,
    })
  }

  return {
    config,
    step,
  }
}

export const Route = createFileRoute(
  '/_brand/campaigns/$campaignId/configuration/$step',
)({
  loader: ({ context, params }) =>
    loadCampaignConfigurationStepRoute({
      campaignId: params.campaignId,
      step: params.step,
      queryClient: context.queryClient,
    }),
  component: CampaignConfigurationStepRoute,
})

function CampaignConfigurationStepRoute() {
  const { config, step } = Route.useLoaderData()

  return <CampaignConfigurationStepSlot config={config} step={step} />
}
