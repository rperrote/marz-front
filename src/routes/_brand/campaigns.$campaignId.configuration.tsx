import { createFileRoute, redirect } from '@tanstack/react-router'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'
import { z } from 'zod'

import { CampaignConfigurationWizard } from '#/features/campaigns/configuration/CampaignConfigurationWizard'
import { campaignConfigurationQueryOptions } from '#/features/campaigns/configuration/hooks'
import type { CampaignConfiguration } from '#/features/campaigns/configuration/hooks'
import { ApiError } from '#/shared/api/mutator'

const configurationSearchSchema = z.object({
  from: z.enum(['brief-builder', 'campaign-list']).optional(),
})

type ConfigurationSearch = z.infer<typeof configurationSearchSchema>
type ConfigurationQueryClient = {
  ensureQueryData: (
    options: ReturnType<typeof campaignConfigurationQueryOptions>,
  ) => Promise<CampaignConfiguration>
}

export function validateConfigurationSearch(
  search: unknown,
): ConfigurationSearch {
  return configurationSearchSchema.parse(search)
}

export function getConfigurationBlockRedirect(
  campaignId: string,
  config: Pick<CampaignConfiguration, 'block_reason'>,
) {
  if (config.block_reason === 'brief_not_confirmed') {
    return redirect({
      to: '/campaigns/$campaignId/brief',
      params: { campaignId },
    })
  }

  if (
    config.block_reason === 'already_active' ||
    config.block_reason === 'not_draft'
  ) {
    return redirect({
      to: '/campaigns/$campaignId',
      params: { campaignId },
    })
  }

  if (config.block_reason === 'forbidden_role') {
    if (typeof window !== 'undefined') {
      toast.error(t`No tenés permisos para configurar esta campaña.`)
    }
    return redirect({ to: '/campaigns' })
  }

  return null
}

export function getConfigurationErrorRedirect(error: unknown) {
  if (
    error instanceof ApiError &&
    error.status === 403 &&
    error.code === 'forbidden_role'
  ) {
    if (typeof window !== 'undefined') {
      toast.error(t`No tenés permisos para configurar esta campaña.`)
    }
    return redirect({ to: '/campaigns' })
  }

  return null
}

export async function loadCampaignConfigurationRoute({
  campaignId,
  pathname,
  queryClient,
}: {
  campaignId: string
  pathname: string
  queryClient: ConfigurationQueryClient
}) {
  let config: CampaignConfiguration

  try {
    config = await queryClient.ensureQueryData(
      campaignConfigurationQueryOptions(campaignId),
    )
  } catch (error) {
    const redirectResult = getConfigurationErrorRedirect(error)
    if (redirectResult) throw redirectResult
    throw error
  }

  const blockRedirect = getConfigurationBlockRedirect(campaignId, config)
  if (blockRedirect) throw blockRedirect

  if (pathname.endsWith('/configuration')) {
    throw redirect({
      to: '/campaigns/$campaignId/configuration/$step',
      params: { campaignId, step: config.current_step },
    })
  }

  return config
}

export const Route = createFileRoute(
  '/_brand/campaigns/$campaignId/configuration',
)({
  validateSearch: validateConfigurationSearch,
  loader: ({ context, params, location }) =>
    loadCampaignConfigurationRoute({
      campaignId: params.campaignId,
      pathname: location.pathname,
      queryClient: context.queryClient,
    }),
  component: CampaignConfigurationRoute,
})

function CampaignConfigurationRoute() {
  const { campaignId } = Route.useParams()
  const search = Route.useSearch()
  const config = Route.useLoaderData()

  return (
    <CampaignConfigurationWizard
      campaignId={campaignId}
      config={config}
      from={search.from}
    />
  )
}
