import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

import type {
  DeliverableDTO,
  ConversationDeliverablesResponse,
} from '#/features/deliverables/types'

import { createWsHandlers } from './handlers'
import type { DomainEventEnvelope } from './events'
import type {
  DraftSubmittedWSPayload,
  DraftApprovedWSPayload,
  DeliverableChangedWSPayload,
  StageApprovedWSPayload,
} from './types'

function makeEnvelope<TPayload>(
  eventType: string,
  payload: TPayload,
): DomainEventEnvelope<TPayload> {
  return {
    event_id: `evt-${eventType}`,
    event_type: eventType,
    schema_version: '1',
    aggregate_id: 'agg-1',
    aggregate_type: 'test',
    occurred_at: new Date().toISOString(),
    payload,
  }
}

function makeDeliverable(overrides?: Partial<DeliverableDTO>): DeliverableDTO {
  return {
    id: 'del-1',
    offer_id: 'off-1',
    offer_stage_id: null,
    platform: 'youtube',
    format: 'video',
    status: 'pending',
    deadline: null,
    current_version: null,
    current_draft: null,
    drafts_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('createWsHandlers', () => {
  let queryClient: QueryClient
  let handlers: ReturnType<typeof createWsHandlers>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity } },
    })
    handlers = createWsHandlers(queryClient)
  })

  describe('draft.submitted', () => {
    it('invalidates conversation deliverables and messages', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      const payload: DraftSubmittedWSPayload = {
        conversation_id: 'conv-1',
        deliverable_id: 'del-1',
        draft_id: 'draft-1',
        version: 1,
        message_id: 'msg-1',
        snapshot: {
          event_type: 'DraftSubmitted',
          deliverable_id: 'del-1',
          deliverable_platform: 'youtube',
          deliverable_format: 'video',
          deliverable_offer_stage_id: null,
          draft_id: 'draft-1',
          version: 1,
          original_filename: 'video.mp4',
          file_size_bytes: 1024,
          duration_sec: 60,
          mime_type: 'video/mp4',
          thumbnail_url: null,
          playback_url: 'https://cdn.test/play',
          playback_url_expires_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
          submitted_by_account_id: 'acc-1',
        },
      }
      const envelope = makeEnvelope('draft.submitted', payload)

      handlers['draft.submitted']!(envelope)

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conversation-deliverables', 'conv-1'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conversation-messages', 'conv-1'],
      })
    })
  })

  describe('draft.approved', () => {
    it('invalidates conversation deliverables and messages', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      const payload: DraftApprovedWSPayload = {
        conversation_id: 'conv-1',
        deliverable_id: 'del-1',
        draft_id: 'draft-1',
        version: 1,
        message_id: 'msg-1',
        snapshot: {
          event_type: 'DraftApproved',
          deliverable_id: 'del-1',
          deliverable_platform: 'youtube',
          deliverable_format: 'video',
          deliverable_offer_stage_id: null,
          draft_id: 'draft-1',
          version: 1,
          approved_at: new Date().toISOString(),
          approved_by_account_id: 'acc-1',
        },
      }
      const envelope = makeEnvelope('draft.approved', payload)

      handlers['draft.approved']!(envelope)

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conversation-deliverables', 'conv-1'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conversation-messages', 'conv-1'],
      })
    })
  })

  describe('deliverable.changed', () => {
    it('merges updated deliverable into cached array', () => {
      const deliverable = makeDeliverable({ status: 'draft_submitted' })
      const oldData: ConversationDeliverablesResponse = {
        offer_id: 'off-1',
        offer_type: 'single',
        deliverables: [makeDeliverable({ status: 'pending' })],
        stages: [],
      }
      queryClient.setQueryData(['conversation-deliverables', 'conv-1'], oldData)

      const payload: DeliverableChangedWSPayload = {
        conversation_id: 'conv-1',
        deliverable,
      }
      const envelope = makeEnvelope('deliverable.changed', payload)

      handlers['deliverable.changed']!(envelope)

      const result = queryClient.getQueryData<ConversationDeliverablesResponse>(
        ['conversation-deliverables', 'conv-1'],
      )
      expect(result?.deliverables[0]?.status).toBe('draft_submitted')
    })

    it('does nothing when cache is empty', () => {
      const payload: DeliverableChangedWSPayload = {
        conversation_id: 'conv-1',
        deliverable: makeDeliverable(),
      }
      const envelope = makeEnvelope('deliverable.changed', payload)

      expect(() => handlers['deliverable.changed']!(envelope)).not.toThrow()
      const result = queryClient.getQueryData([
        'conversation-deliverables',
        'conv-1',
      ])
      expect(result).toBeUndefined()
    })
  })

  describe('stage.approved', () => {
    it('invalidates conversation deliverables and offer', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      const payload: StageApprovedWSPayload = {
        conversation_id: 'conv-1',
        offer_id: 'off-1',
        stage_id: 'stage-1',
        position: 1,
        total_stages: 3,
        approved_at: new Date().toISOString(),
      }
      const envelope = makeEnvelope('stage.approved', payload)

      handlers['stage.approved']!(envelope)

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conversation-deliverables', 'conv-1'],
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['offer', 'off-1'],
      })
    })
  })

  describe('stage.opened', () => {
    it('invalidates conversation deliverables', () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      const envelope = makeEnvelope('stage.opened', {
        conversation_id: 'conv-1',
      })

      handlers['stage.opened']!(envelope)

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conversation-deliverables', 'conv-1'],
      })
    })
  })

  describe('integration: two tabs / two query clients', () => {
    it('updates both caches on deliverable.changed without reload', () => {
      const qc1 = new QueryClient()
      const qc2 = new QueryClient()
      const h1 = createWsHandlers(qc1)
      const h2 = createWsHandlers(qc2)

      const oldData: ConversationDeliverablesResponse = {
        offer_id: 'off-1',
        offer_type: 'single',
        deliverables: [makeDeliverable({ status: 'pending' })],
        stages: [],
      }
      qc1.setQueryData(['conversation-deliverables', 'conv-1'], oldData)
      qc2.setQueryData(['conversation-deliverables', 'conv-1'], oldData)

      const deliverable = makeDeliverable({ status: 'draft_submitted' })
      const envelope = makeEnvelope<DeliverableChangedWSPayload>(
        'deliverable.changed',
        { conversation_id: 'conv-1', deliverable },
      )

      h1['deliverable.changed']!(envelope)
      h2['deliverable.changed']!(envelope)

      expect(
        qc1.getQueryData<ConversationDeliverablesResponse>([
          'conversation-deliverables',
          'conv-1',
        ])?.deliverables[0]?.status,
      ).toBe('draft_submitted')
      expect(
        qc2.getQueryData<ConversationDeliverablesResponse>([
          'conversation-deliverables',
          'conv-1',
        ])?.deliverables[0]?.status,
      ).toBe('draft_submitted')
    })
  })
})
