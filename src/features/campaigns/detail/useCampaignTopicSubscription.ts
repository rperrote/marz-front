import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import type {
  CampaignActivityItem,
  CampaignDiscoveryCounts,
  CampaignDiscoverySummaryResponse,
  CampaignOverviewResponse,
} from '#/shared/api/generated/model'
import { useWebSocket } from '#/shared/ws/useWebSocket'
import type { DomainEventEnvelope, EventHandler } from '#/shared/ws/events'

import type { DiscoverySection } from './tracking'
import { campaignOverviewQueryKey } from './useCampaignOverviewQuery'

const MAX_SEEN_EVENTS = 200
const CAMPAIGN_EVENT_TYPES = {
  discoveryUpdated: 'campaign.discovery.updated',
  participantsUpdated: 'campaign.participants.updated',
  videosUpdated: 'campaign.videos.updated',
  activityCreated: 'campaign.activity.created',
} as const

function getCampaignDiscoveryQueryKey(
  campaignId: string,
  section: DiscoverySection | 'summary',
  params?: Record<string, unknown>,
) {
  return ['campaign', campaignId, 'discovery', section, params ?? {}] as const
}

interface CampaignRefreshPayload {
  campaign_id: string
  reason?: string
}

interface CampaignDiscoveryUpdatedPayload extends CampaignRefreshPayload {
  changed?: {
    section?: DiscoverySection
  }
  counts?: Partial<CampaignDiscoveryCounts>
}

interface CampaignActivityCreatedPayload extends CampaignRefreshPayload {
  activity?: unknown
}

export function useCampaignTopicSubscription(campaignId: string) {
  const queryClient = useQueryClient()
  const queryClientRef = useRef(queryClient)
  queryClientRef.current = queryClient
  const seenEventIdsRef = useRef(new Set<string>())
  const topic = `campaign:${campaignId}`

  const { status, send } = useWebSocket({
    handlers: {
      [CAMPAIGN_EVENT_TYPES.discoveryUpdated]: ((envelope) => {
        if (
          !markCampaignEventSeen(seenEventIdsRef.current, envelope.event_id)
        ) {
          return
        }
        handleDiscoveryUpdated(
          queryClientRef.current,
          campaignId,
          envelope as DomainEventEnvelope<CampaignDiscoveryUpdatedPayload>,
        )
      }) satisfies EventHandler,
      [CAMPAIGN_EVENT_TYPES.participantsUpdated]: ((envelope) => {
        if (
          !markCampaignEventSeen(seenEventIdsRef.current, envelope.event_id)
        ) {
          return
        }
        handleParticipantsUpdated(queryClientRef.current, campaignId)
      }) satisfies EventHandler,
      [CAMPAIGN_EVENT_TYPES.videosUpdated]: ((envelope) => {
        if (
          !markCampaignEventSeen(seenEventIdsRef.current, envelope.event_id)
        ) {
          return
        }
        handleVideosUpdated(queryClientRef.current, campaignId)
      }) satisfies EventHandler,
      [CAMPAIGN_EVENT_TYPES.activityCreated]: ((envelope) => {
        if (
          !markCampaignEventSeen(seenEventIdsRef.current, envelope.event_id)
        ) {
          return
        }
        handleActivityCreated(
          queryClientRef.current,
          campaignId,
          envelope as DomainEventEnvelope<CampaignActivityCreatedPayload>,
        )
      }) satisfies EventHandler,
    },
    enabled: campaignId.length > 0,
  })

  useEffect(() => {
    if (status !== 'open') return

    send({ type: 'subscribe', topic })

    return () => {
      send({ type: 'unsubscribe', topic })
    }
  }, [send, status, topic])

  return { status }
}

export function markCampaignEventSeen(
  seenEventIds: Set<string>,
  eventId: string,
  maxSize = MAX_SEEN_EVENTS,
) {
  if (seenEventIds.has(eventId)) return false

  seenEventIds.add(eventId)
  while (seenEventIds.size > maxSize) {
    const oldest = seenEventIds.values().next().value
    if (typeof oldest !== 'string') break
    seenEventIds.delete(oldest)
  }
  return true
}

function handleDiscoveryUpdated(
  queryClient: QueryClient,
  campaignId: string,
  envelope: DomainEventEnvelope<CampaignDiscoveryUpdatedPayload>,
) {
  if (envelope.payload.campaign_id !== campaignId) return

  const summaryKey = getCampaignDiscoveryQueryKey(campaignId, 'summary')
  if (envelope.payload.counts) {
    queryClient.setQueryData<CampaignDiscoverySummaryResponse>(
      summaryKey,
      (old) => {
        if (!old) return old
        return {
          ...old,
          counts: {
            ...old.counts,
            ...envelope.payload.counts,
          },
        }
      },
    )
  } else {
    void queryClient.invalidateQueries({ queryKey: summaryKey })
  }

  const changedSection = envelope.payload.changed?.section
  if (changedSection) {
    void queryClient.invalidateQueries({
      queryKey: ['campaign', campaignId, 'discovery', changedSection],
    })
  }
}

function handleParticipantsUpdated(
  queryClient: QueryClient,
  campaignId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: ['campaign', campaignId, 'participants'],
  })
  void queryClient.invalidateQueries({
    queryKey: campaignOverviewQueryKey(campaignId),
  })
}

function handleVideosUpdated(queryClient: QueryClient, campaignId: string) {
  void queryClient.invalidateQueries({
    queryKey: ['campaign', campaignId, 'videos'],
  })
  void queryClient.invalidateQueries({
    queryKey: campaignOverviewQueryKey(campaignId),
  })
}

function handleActivityCreated(
  queryClient: QueryClient,
  campaignId: string,
  envelope: DomainEventEnvelope<CampaignActivityCreatedPayload>,
) {
  if (envelope.payload.campaign_id !== campaignId) return

  const activity = getActivityItem(envelope.payload)
  if (!activity) {
    void queryClient.invalidateQueries({
      queryKey: campaignOverviewQueryKey(campaignId),
    })
    return
  }

  const overviewKey = campaignOverviewQueryKey(campaignId)
  if (!queryClient.getQueryData<CampaignOverviewResponse>(overviewKey)) {
    void queryClient.invalidateQueries({
      queryKey: overviewKey,
    })
    return
  }

  queryClient.setQueryData<CampaignOverviewResponse>(overviewKey, (old) => {
    if (!old) return old
    return {
      ...old,
      recent_activity: prependActivity(old.recent_activity, activity),
    }
  })
}

function prependActivity(
  activity: CampaignActivityItem[],
  nextActivity: CampaignActivityItem,
) {
  if (activity.some((item) => item.id === nextActivity.id)) return activity
  const maxItems = Math.max(activity.length, 5)
  return [nextActivity, ...activity].slice(0, maxItems)
}

function getActivityItem(
  payload: CampaignActivityCreatedPayload,
): CampaignActivityItem | undefined {
  if (isCampaignActivityItem(payload.activity)) return payload.activity
  if (isCampaignActivityItem(payload)) return payload
  return undefined
}

function isCampaignActivityItem(value: unknown): value is CampaignActivityItem {
  if (!isRecord(value)) return false
  return (
    typeof value['id'] === 'string' &&
    typeof value['source'] === 'string' &&
    typeof value['source_ref_type'] === 'string' &&
    typeof value['source_ref_id'] === 'string' &&
    typeof value['title'] === 'string' &&
    typeof value['occurred_at'] === 'string' &&
    isNullableString(value['actor_account_id']) &&
    isNullableString(value['creator_account_id']) &&
    isNullableString(value['body'])
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNullableString(value: unknown) {
  return typeof value === 'string' || value === null
}
