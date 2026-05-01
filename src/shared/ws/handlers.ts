import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import type {
  ConversationDeliverablesResponse,
  DeliverableDTO,
} from '#/features/deliverables/types'
import {
  trackDeliverableTotalRounds,
  trackMultistageStageUnlocked,
  trackTimeToResolveRound,
} from '#/features/deliverables/analytics'
import { getConversationDeliverablesQueryKey } from '#/shared/queries/deliverables'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import {
  getConversationOffersQueryKey,
  getOfferQueryKey,
} from '#/shared/queries/offers'

import type { DomainEventEnvelope, EventHandler } from './events'
import type {
  DraftApprovedWSPayload,
  DraftSubmittedWSPayload,
  DeliverableChangedWSPayload,
  StageApprovedWSPayload,
  StageOpenedWSPayload,
} from './types'

interface SystemEventMessage {
  id: string
  conversation_id: string
  author_account_id: string | null
  type: 'text' | 'system_event'
  text_content: string | null
  event_type: string | null
  payload: Record<string, unknown> | null
  created_at: string
  read_by_self: boolean
}

/**
 * Factory for domain-event handlers keyed by event_type.
 * Wired into useWebSocket via the handlers option.
 */
export function createWsHandlers(
  queryClient: QueryClient,
  sessionKind?: 'brand' | 'creator',
): Record<string, EventHandler> {
  return {
    'draft.submitted': (envelope) => {
      const payload = (envelope as DomainEventEnvelope<DraftSubmittedWSPayload>)
        .payload
      const deliverableAnalytics = getCachedDeliverableAnalytics(
        queryClient,
        payload.conversation_id,
        payload.deliverable_id,
      )
      if (deliverableAnalytics?.deliverable.latest_change_request) {
        trackTimeToResolveRound({
          deliverable_index: deliverableAnalytics.deliverableIndex,
          round_index: deliverableAnalytics.deliverable.change_requests_count,
          resolution: 'another_round',
          round_duration_seconds: secondsBetween(
            deliverableAnalytics.deliverable.latest_change_request.requested_at,
            payload.snapshot.submitted_at,
          ),
        })
      }

      void queryClient.invalidateQueries({
        queryKey: getConversationDeliverablesQueryKey(payload.conversation_id),
      })
      void queryClient.invalidateQueries({
        queryKey: getMessagesQueryKey(payload.conversation_id),
      })
    },

    'draft.approved': (envelope) => {
      const payload = (envelope as DomainEventEnvelope<DraftApprovedWSPayload>)
        .payload
      const deliverableAnalytics = getCachedDeliverableAnalytics(
        queryClient,
        payload.conversation_id,
        payload.deliverable_id,
      )
      if (deliverableAnalytics?.deliverable.latest_change_request) {
        trackTimeToResolveRound({
          deliverable_index: deliverableAnalytics.deliverableIndex,
          round_index: deliverableAnalytics.deliverable.change_requests_count,
          resolution: 'approved',
          round_duration_seconds: secondsBetween(
            deliverableAnalytics.deliverable.latest_change_request.requested_at,
            payload.snapshot.approved_at,
          ),
        })
      }
      if (deliverableAnalytics) {
        trackDeliverableTotalRounds({
          deliverable_index: deliverableAnalytics.deliverableIndex,
          total_rounds: deliverableAnalytics.deliverable.change_requests_count,
          final_outcome: 'approved',
        })
      }

      void queryClient.invalidateQueries({
        queryKey: getConversationDeliverablesQueryKey(payload.conversation_id),
      })
      void queryClient.invalidateQueries({
        queryKey: getMessagesQueryKey(payload.conversation_id),
      })
    },

    'deliverable.changed': (envelope) => {
      const payload = (
        envelope as DomainEventEnvelope<DeliverableChangedWSPayload>
      ).payload
      const key = getConversationDeliverablesQueryKey(payload.conversation_id)

      queryClient.setQueryData(key, (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        const response = old as { deliverables?: DeliverableDTO[] }
        if (!Array.isArray(response.deliverables)) return old

        if (
          typeof payload.deliverable !== 'object' ||
          payload.deliverable === null
        )
          return old
        // RAFITA:ANY: DeliverableChangedWSPayload.deliverable is typed as unknown
        // until B.6 deploys and Orval regenerates. Guard above prevents
        // null/non-object shapes.
        const updated = payload.deliverable as DeliverableDTO
        return {
          ...response,
          deliverables: response.deliverables.map((d) =>
            d.id === updated.id ? updated : d,
          ),
        }
      })
    },

    'stage.approved': (envelope) => {
      const payload = (envelope as DomainEventEnvelope<StageApprovedWSPayload>)
        .payload

      insertSystemEventMessage(queryClient, {
        id: envelope.event_id,
        conversation_id: payload.conversation_id,
        author_account_id: envelope.actor_account_id ?? null,
        type: 'system_event',
        text_content: null,
        event_type: 'StageApproved',
        payload: {},
        created_at: envelope.occurred_at,
        read_by_self: false,
      })

      void queryClient.invalidateQueries({
        queryKey: getConversationDeliverablesQueryKey(payload.conversation_id),
      })
      void queryClient.invalidateQueries({
        queryKey: getOfferQueryKey(payload.offer_id),
      })
      void queryClient.invalidateQueries({
        queryKey: getConversationOffersQueryKey(payload.conversation_id),
      })
    },

    'stage.opened': (envelope) => {
      const payload = (envelope as DomainEventEnvelope<StageOpenedWSPayload>)
        .payload

      if (sessionKind === 'brand') {
        trackMultistageStageUnlocked({
          offer_id: payload.offer_id,
          stage_id: payload.stage_id,
          position: payload.position,
        })
      }

      insertSystemEventMessage(queryClient, {
        id: envelope.event_id,
        conversation_id: payload.conversation_id,
        author_account_id: envelope.actor_account_id ?? null,
        type: 'system_event',
        text_content: null,
        event_type: 'StageOpened',
        payload: {
          snapshot: {
            position: payload.position,
            total: payload.total_stages,
            name: payload.name,
            prev_stage_position: payload.prev_stage_position,
          },
        },
        created_at: envelope.occurred_at,
        read_by_self: false,
      })

      void queryClient.invalidateQueries({
        queryKey: getConversationDeliverablesQueryKey(payload.conversation_id),
      })
      void queryClient.invalidateQueries({
        queryKey: getConversationOffersQueryKey(payload.conversation_id),
      })
    },
  }
}

function getCachedDeliverableAnalytics(
  queryClient: QueryClient,
  conversationId: string,
  deliverableId: string,
):
  | {
      deliverable: DeliverableDTO
      deliverableIndex: number
    }
  | undefined {
  const data = queryClient.getQueryData<ConversationDeliverablesResponse>(
    getConversationDeliverablesQueryKey(conversationId),
  )
  if (!data) return undefined

  const deliverableIndex = data.deliverables.findIndex(
    (deliverable) => deliverable.id === deliverableId,
  )
  if (deliverableIndex < 0) return undefined

  const deliverable = data.deliverables[deliverableIndex]
  if (!deliverable) return undefined

  return { deliverable, deliverableIndex }
}

function secondsBetween(startIso: string, endIso: string): number {
  return Math.max(0, (Date.parse(endIso) - Date.parse(startIso)) / 1000)
}

type MessagesInfiniteData = InfiniteData<
  {
    data: {
      data: SystemEventMessage[]
      next_before_cursor: string | null
      has_more: boolean
    }
    status: number
  },
  string | undefined
>

function insertSystemEventMessage(
  queryClient: QueryClient,
  message: SystemEventMessage,
) {
  const messagesKey = getMessagesQueryKey(message.conversation_id)

  queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (old) => {
    if (!old || old.pages.length === 0) return old

    const alreadyExists = old.pages.some((page) =>
      page.data.data.some((msg) => msg.id === message.id),
    )
    if (alreadyExists) return old

    const pages = [...old.pages]
    const firstPage = pages[0]!
    pages[0] = {
      ...firstPage,
      data: {
        ...firstPage.data,
        data: [message, ...firstPage.data.data],
      },
    }
    return { ...old, pages }
  })
}
