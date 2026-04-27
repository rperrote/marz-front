import { describe, it, expect, vi, beforeEach } from 'vitest'
import { customFetch } from '#/shared/api/mutator'
import {
  trackUploadStarted,
  trackUploadProgress,
  trackUploadCompleted,
  trackUploadFailed,
  trackDraftSubmittedCardSeen,
  trackDraftPlayerPlayed,
  trackDraftApproved,
  trackMultistageStageUnlocked,
} from '../analytics'

vi.mock('#/shared/api/mutator', () => ({
  customFetch: vi.fn().mockResolvedValue(undefined),
}))

const mockFetch = vi.mocked(customFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

function getLastFetchBody() {
  const body = mockFetch.mock.calls[0]![1]!.body as string
  return JSON.parse(body)
}

describe('trackUploadStarted', () => {
  it('sends correct payload', () => {
    trackUploadStarted({
      deliverable_id: 'del-1',
      file_size_bytes: 1024,
      content_type: 'video/mp4',
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const body = getLastFetchBody()
    expect(body.event_name).toBe('upload_started')
    expect(body.properties.deliverable_id).toBe('del-1')
    expect(body.properties.file_size_bytes).toBe(1024)
    expect(body.properties.content_type).toBe('video/mp4')
    expect(body.occurred_at).toBeTypeOf('string')
  })
})

describe('trackUploadProgress', () => {
  it('sends correct payload', () => {
    trackUploadProgress({
      deliverable_id: 'del-1',
      milestone: 50,
    })

    const body = getLastFetchBody()
    expect(body.event_name).toBe('upload_progress')
    expect(body.properties.deliverable_id).toBe('del-1')
    expect(body.properties.milestone).toBe(50)
  })
})

describe('trackUploadCompleted', () => {
  it('sends correct payload', () => {
    trackUploadCompleted({
      deliverable_id: 'del-1',
      draft_id: 'draft-1',
      version: 1,
      duration_ms: 12345,
    })

    const body = getLastFetchBody()
    expect(body.event_name).toBe('upload_completed')
    expect(body.properties.deliverable_id).toBe('del-1')
    expect(body.properties.draft_id).toBe('draft-1')
    expect(body.properties.version).toBe(1)
    expect(body.properties.duration_ms).toBe(12345)
  })
})

describe('trackUploadFailed', () => {
  it('sends correct payload', () => {
    trackUploadFailed({
      deliverable_id: 'del-1',
      reason: 'network',
    })

    const body = getLastFetchBody()
    expect(body.event_name).toBe('upload_failed')
    expect(body.properties.deliverable_id).toBe('del-1')
    expect(body.properties.reason).toBe('network')
  })
})

describe('trackDraftSubmittedCardSeen', () => {
  it('sends correct payload', () => {
    trackDraftSubmittedCardSeen({
      message_id: 'msg-1',
      deliverable_id: 'del-1',
      version: 1,
    })

    const body = getLastFetchBody()
    expect(body.event_name).toBe('draft_submitted_card_seen')
    expect(body.properties.message_id).toBe('msg-1')
    expect(body.properties.deliverable_id).toBe('del-1')
    expect(body.properties.version).toBe(1)
  })
})

describe('trackDraftPlayerPlayed', () => {
  it('sends correct payload', () => {
    trackDraftPlayerPlayed({
      deliverable_id: 'del-1',
      draft_id: 'draft-1',
    })

    const body = getLastFetchBody()
    expect(body.event_name).toBe('draft_player_played')
    expect(body.properties.deliverable_id).toBe('del-1')
    expect(body.properties.draft_id).toBe('draft-1')
  })
})

describe('trackDraftApproved', () => {
  it('sends correct payload', () => {
    trackDraftApproved({
      deliverable_id: 'del-1',
      draft_id: 'draft-1',
      version: 1,
    })

    const body = getLastFetchBody()
    expect(body.event_name).toBe('draft_approved')
    expect(body.properties.deliverable_id).toBe('del-1')
    expect(body.properties.draft_id).toBe('draft-1')
    expect(body.properties.version).toBe(1)
  })
})

describe('trackMultistageStageUnlocked', () => {
  it('sends correct payload', () => {
    trackMultistageStageUnlocked({
      offer_id: 'off-1',
      stage_id: 'stage-1',
      position: 2,
    })

    const body = getLastFetchBody()
    expect(body.event_name).toBe('multistage_stage_unlocked')
    expect(body.properties.offer_id).toBe('off-1')
    expect(body.properties.stage_id).toBe('stage-1')
    expect(body.properties.position).toBe(2)
  })
})

describe('fire-and-forget', () => {
  it('does not throw when customFetch fails', () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    expect(() =>
      trackUploadStarted({
        deliverable_id: 'del-1',
        file_size_bytes: 1024,
        content_type: 'video/mp4',
      }),
    ).not.toThrow()
  })
})
