import { describe, it, expect, vi, beforeEach } from 'vitest'
import { customFetch } from '#/shared/api/mutator'
import { trackChatEvent, toLengthBucket, estimateLatencyMs } from '../track'

vi.mock('#/shared/api/mutator', () => ({
  customFetch: vi.fn().mockResolvedValue(undefined),
}))

const mockFetch = vi.mocked(customFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('trackChatEvent', () => {
  it('sends conversation_opened with correct shape', () => {
    trackChatEvent('conversation_opened', {
      conversation_id: 'conv-1',
      counterpart_kind: 'creator_profile',
      has_unread: true,
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string)
    expect(body.event).toBe('conversation_opened')
    expect(body.properties).toEqual({
      conversation_id: 'conv-1',
      counterpart_kind: 'creator_profile',
      has_unread: true,
    })
    expect(body.timestamp).toBeDefined()
  })

  it('sends message_sent with correct shape', () => {
    trackChatEvent('message_sent', {
      conversation_id: 'conv-2',
      length_bucket: '50-200',
      idempotent_replay: false,
    })

    const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string)
    expect(body.event).toBe('message_sent')
    expect(body.properties).toEqual({
      conversation_id: 'conv-2',
      length_bucket: '50-200',
      idempotent_replay: false,
    })
  })

  it('sends message_received_live with correct shape', () => {
    trackChatEvent('message_received_live', {
      conversation_id: 'conv-3',
      latency_ms_estimate: 150,
    })

    const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string)
    expect(body.event).toBe('message_received_live')
    expect(body.properties).toEqual({
      conversation_id: 'conv-3',
      latency_ms_estimate: 150,
    })
  })

  it('sends history_page_loaded with correct shape', () => {
    trackChatEvent('history_page_loaded', {
      conversation_id: 'conv-4',
      page_index: 2,
      items_count: 30,
    })

    const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string)
    expect(body.event).toBe('history_page_loaded')
    expect(body.properties).toEqual({
      conversation_id: 'conv-4',
      page_index: 2,
      items_count: 30,
    })
  })

  it('sends presence_state_changed with correct shape', () => {
    trackChatEvent('presence_state_changed', {
      conversation_id: 'conv-5',
      counterpart_account_id: 'acc-99',
      state: 'online',
    })

    const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string)
    expect(body.event).toBe('presence_state_changed')
    expect(body.properties).toEqual({
      conversation_id: 'conv-5',
      counterpart_account_id: 'acc-99',
      state: 'online',
    })
  })

  it('never includes text_content in any payload', () => {
    trackChatEvent('message_sent', {
      conversation_id: 'conv-x',
      length_bucket: '<50',
      idempotent_replay: false,
    })

    trackChatEvent('message_received_live', {
      conversation_id: 'conv-y',
      latency_ms_estimate: 50,
    })

    for (const call of mockFetch.mock.calls) {
      const body = JSON.parse(call[1]!.body as string)
      expect(body.properties).not.toHaveProperty('text_content')
    }
  })

  it('swallows errors without propagating', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network fail'))

    expect(() => {
      trackChatEvent('conversation_opened', {
        conversation_id: 'conv-err',
        counterpart_kind: 'brand_workspace',
        has_unread: false,
      })
    }).not.toThrow()

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledOnce()
    })
  })
})

describe('toLengthBucket', () => {
  it.each([
    [0, '<50'],
    [49, '<50'],
    [50, '50-200'],
    [200, '50-200'],
    [201, '200-500'],
    [500, '200-500'],
    [501, '500-2000'],
    [2000, '500-2000'],
    [2001, '2000+'],
    [10000, '2000+'],
  ] as const)('maps length %d to bucket %s', (length, expected) => {
    expect(toLengthBucket(length)).toBe(expected)
  })
})

describe('estimateLatencyMs', () => {
  it('returns positive delta between server time and client time', () => {
    const serverTime = new Date(Date.now() - 500).toISOString()
    const latency = estimateLatencyMs(serverTime)
    expect(latency).toBeGreaterThanOrEqual(500)
    expect(latency).toBeLessThan(600)
  })

  it('returns 0 for future server timestamps', () => {
    const futureTime = new Date(Date.now() + 10_000).toISOString()
    expect(estimateLatencyMs(futureTime)).toBe(0)
  })
})
