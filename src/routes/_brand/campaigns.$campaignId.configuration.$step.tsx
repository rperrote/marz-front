import { createFileRoute, redirect } from '@tanstack/react-router'

import { CampaignConfigurationStepSlot } from '#/features/campaigns/configuration/CampaignConfigurationWizard'
import {
  campaignConfigurationQueryOptions,
  isCampaignConfigurationStep,
} from '#/features/campaigns/configuration/hooks'
import type { CampaignConfiguration } from '#/features/campaigns/configuration/hooks'

type ConfigurationQueryClient = {
  ensureQueryData: (
    options: ReturnType<typeof campaignConfigurationQueryOptions>,
  ) => Promise<CampaignConfiguration>
}

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
