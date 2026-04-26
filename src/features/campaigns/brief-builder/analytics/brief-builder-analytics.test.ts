import { describe, it, expect, vi, beforeEach } from 'vitest'
import { customFetch } from '#/shared/api/mutator'
import {
  trackBriefBuilderStarted,
  trackBriefBuilderAbandoned,
  trackBriefBuilderAbandonedBeacon,
} from './brief-builder-analytics'

vi.mock('#/shared/api/mutator', () => ({
  customFetch: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('#/env', () => ({
  env: { VITE_API_URL: 'https://api.test.com' },
}))

const mockFetch = vi.mocked(customFetch)

beforeEach(() => {
  vi.clearAllMocks()
  navigator.sendBeacon = vi.fn().mockReturnValue(true)
})

describe('trackBriefBuilderStarted', () => {
  it('sends POST with workspace_id and processing_token', () => {
    trackBriefBuilderStarted({
      workspace_id: 'ws-1',
      processing_token: 'tok-abc',
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/analytics/events', {
      method: 'POST',
      body: expect.stringContaining('"brief_builder_started"'),
    })

    const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string)
    expect(body.event).toBe('brief_builder_started')
    expect(body.properties.workspace_id).toBe('ws-1')
    expect(body.properties.processing_token).toBe('tok-abc')
    expect(body.timestamp).toBeDefined()
  })
})

describe('trackBriefBuilderAbandoned', () => {
  it('sends POST with phase and processing_token', () => {
    trackBriefBuilderAbandoned({
      phase: 2,
      processing_token: 'tok-xyz',
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string)
    expect(body.event).toBe('brief_builder_abandoned')
    expect(body.properties.phase).toBe(2)
    expect(body.properties.processing_token).toBe('tok-xyz')
  })
})

describe('trackBriefBuilderAbandonedBeacon', () => {
  it('uses navigator.sendBeacon with Blob payload containing event data', async () => {
    trackBriefBuilderAbandonedBeacon({
      phase: 3,
      processing_token: 'tok-123',
    })

    expect(navigator.sendBeacon).toHaveBeenCalledOnce()
    const [url, blob] = vi.mocked(navigator.sendBeacon).mock.calls[0]!
    expect(url).toBe('https://api.test.com/api/v1/analytics/events')
    expect(blob).toBeInstanceOf(Blob)
    expect((blob as Blob).type).toBe('application/json')

    const text = await (blob as Blob).text()
    const body = JSON.parse(text)
    expect(body.event).toBe('brief_builder_abandoned')
    expect(body.properties.phase).toBe(3)
    expect(body.properties.processing_token).toBe('tok-123')
  })
})
