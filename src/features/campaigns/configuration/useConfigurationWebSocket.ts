import { useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { t } from '@lingui/core/macro'
import { toast } from 'sonner'

import { getActiveCampaignsQueryKey } from '#/shared/api/activeCampaigns'
import { getCampaignsListQueryKey } from '#/features/campaigns/hooks/useCampaignsList'
import { useWebSocket } from '#/shared/ws/useWebSocket'
import type {
  CampaignConfigurationActivatedEvent,
  CampaignConfigurationUpdatedEvent,
  EventHandler,
} from '#/shared/ws/events'
import type { CampaignConfiguration } from './hooks'
import {
  campaignConfigurationQueryKey,
  campaignDetailSearchDefaults,
} from './hooks'

interface CampaignConfigurationWsHandlersOptions {
  campaignId: string
  queryClient: QueryClient
  navigateToCampaign: () => void
}

export function createCampaignConfigurationWsHandlers({
  campaignId,
  queryClient,
  navigateToCampaign,
}: CampaignConfigurationWsHandlersOptions): Record<string, EventHandler> {
  return {
    'campaigns.configuration.updated': ((envelope) => {
      const typed = envelope as CampaignConfigurationUpdatedEvent
      const payload = typed.payload
      if (payload.campaign_id !== campaignId) return

      const queryKey = campaignConfigurationQueryKey(campaignId)
      const current = queryClient.getQueryData<CampaignConfiguration>(queryKey)
      if (
        current &&
        payload.configuration_version <= current.configuration_version
      ) {
        return
      }

      if (current) {
        queryClient.setQueryData<CampaignConfiguration>(queryKey, {
          ...current,
          current_step: payload.current_step,
          completed_steps: payload.completed_steps,
          configuration_version: payload.configuration_version,
          updated_at: payload.updated_at,
        })
      }

      void queryClient.invalidateQueries({ queryKey })
      toast.info(t`La configuración cambió en otra sesión. Recargando.`)
    }) satisfies EventHandler,

    'campaigns.configuration.activated': ((envelope) => {
      const typed = envelope as CampaignConfigurationActivatedEvent
      const payload = typed.payload
      if (payload.campaign_id !== campaignId) return

      void queryClient.invalidateQueries({
        queryKey: getCampaignsListQueryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: getActiveCampaignsQueryKey(),
      })
      navigateToCampaign()
    }) satisfies EventHandler,
  }
}

export function useConfigurationWebSocket(campaignId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handlers = useMemo(
    () =>
      createCampaignConfigurationWsHandlers({
        campaignId,
        queryClient,
        navigateToCampaign: () => {
          void navigate({
            to: '/campaigns/$campaignId',
            params: { campaignId },
            search: campaignDetailSearchDefaults,
          })
        },
      }),
    [campaignId, navigate, queryClient],
  )

  const { status, send } = useWebSocket({
    enabled: true,
    handlers,
  })

  useEffect(() => {
    if (status !== 'open') return

    const topic = `campaign:${campaignId}`
    send({ type: 'subscribe', topic })

    return () => {
      send({ type: 'unsubscribe', topic })
    }
  }, [campaignId, send, status])

  return { status }
}
