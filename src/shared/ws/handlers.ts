import type { QueryClient } from '@tanstack/react-query'

import type { DeliverableDTO } from '#/features/deliverables/types'
import { getConversationDeliverablesQueryKey } from '#/shared/queries/deliverables'
import { getMessagesQueryKey } from '#/shared/queries/messages'
import { getOfferQueryKey } from '#/shared/queries/offers'

import type { DomainEventEnvelope, EventHandler } from './events'
import type {
  DraftApprovedWSPayload,
  DraftSubmittedWSPayload,
  DeliverableChangedWSPayload,
  StageApprovedWSPayload,
} from './types'

/**
 * Factory for domain-event handlers keyed by event_type.
 * Wired into useWebSocket via the handlers option.
 */
export function createWsHandlers(
  queryClient: QueryClient,
): Record<string, EventHandler> {
  return {
    'draft.submitted': (envelope) => {
      const payload = (envelope as DomainEventEnvelope<DraftSubmittedWSPayload>)
        .payload

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

      void queryClient.invalidateQueries({
        queryKey: getConversationDeliverablesQueryKey(payload.conversation_id),
      })
      void queryClient.invalidateQueries({
        queryKey: getOfferQueryKey(payload.offer_id),
      })
    },

    'stage.opened': (envelope) => {
      const payload = envelope.payload as { conversation_id: string }

      void queryClient.invalidateQueries({
        queryKey: getConversationDeliverablesQueryKey(payload.conversation_id),
      })
    },
  }
}
