import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { DomainEventEnvelope } from '#/shared/ws/events'
import type {
  BriefProcessingStepCompleted,
  BriefProcessingCompleted,
  BriefProcessingFailed,
} from '#/features/campaigns/brief-builder/brief-builder.types'
import type { BriefDraft } from '#/features/campaigns/brief-builder/store'

let capturedOptions: {
  enabled: boolean
  handlers: Record<string, (envelope: DomainEventEnvelope) => void>
}

vi.mock('#/shared/ws/useWebSocket', () => ({
  useWebSocket: (opts: typeof capturedOptions) => {
    capturedOptions = opts
    return { status: 'idle' as const, send: vi.fn() }
  },
}))

// eslint-disable-next-line import/first
import { useBriefBuilderWS } from './useBriefBuilderWS'

function envelope<T>(eventType: string, payload: T): DomainEventEnvelope<T> {
  return {
    event_id: crypto.randomUUID(),
    event_type: eventType,
    schema_version: '1',
    aggregate_id: 'agg-1',
    aggregate_type: 'brief',
    occurred_at: new Date().toISOString(),
    payload,
  }
}

const TOKEN = 'tok-abc-123'
const OTHER_TOKEN = 'tok-other-999'

const MOCK_DRAFT: BriefDraft = {
  campaign: {
    name: 'Test Brief',
    objective: 'brand_awareness',
    budget_amount: 5000,
    budget_currency: 'USD',
    deadline: '',
  },
  brief: {
    icp_description: 'Gen Z creators',
    icp_age_min: 18,
    icp_age_max: 30,
    icp_genders: ['male', 'female'],
    icp_countries: ['US'],
    icp_platforms: ['instagram'],
    icp_interests: ['fitness'],
    scoring_dimensions: [
      {
        id: 'test-dim-1',
        name: 'Engagement',
        description: 'Rate',
        weight_pct: 100,
        positive_signals: [],
        negative_signals: [],
      },
    ],
    hard_filters: [],
    disqualifiers: [],
  },
}

describe('useBriefBuilderWS', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOptions = undefined as any
  })

  it('passes enabled=false when processingToken is null', () => {
    renderHook(() => useBriefBuilderWS(null))
    expect(capturedOptions.enabled).toBe(false)
  })

  it('passes enabled=true when processingToken is set', () => {
    renderHook(() => useBriefBuilderWS(TOKEN))
    expect(capturedOptions.enabled).toBe(true)
  })

  it('starts with 5 steps, first active, rest pending', () => {
    const { result } = renderHook(() => useBriefBuilderWS(TOKEN))
    expect(result.current.steps).toHaveLength(5)
    expect(result.current.steps[0]!.status).toBe('active')
    expect(result.current.steps[1]!.status).toBe('pending')
    expect(result.current.steps[4]!.status).toBe('pending')
    expect(result.current.status).toBe('pending')
  })

  it('updates step status on step_completed event', () => {
    const { result } = renderHook(() => useBriefBuilderWS(TOKEN))

    act(() => {
      capturedOptions.handlers['brief.processing.step_completed']!(
        envelope<BriefProcessingStepCompleted>(
          'brief.processing.step_completed',
          {
            processing_token: TOKEN,
            step: 1,
            step_name: 'reading_website',
            step_label: 'Leyendo sitio web',
            total_steps: 5,
            step_status: 'completed',
            error_message: null,
            timestamp: new Date().toISOString(),
          },
        ) as DomainEventEnvelope,
      )
    })

    expect(result.current.steps[0]!.status).toBe('completed')
    expect(result.current.steps[1]!.status).toBe('active')
  })

  it('marks step as failed with error message', () => {
    const { result } = renderHook(() => useBriefBuilderWS(TOKEN))

    act(() => {
      capturedOptions.handlers['brief.processing.step_completed']!(
        envelope<BriefProcessingStepCompleted>(
          'brief.processing.step_completed',
          {
            processing_token: TOKEN,
            step: 2,
            step_name: 'processing_description',
            step_label: 'Procesando descripción',
            total_steps: 5,
            step_status: 'failed',
            error_message: 'Could not parse',
            timestamp: new Date().toISOString(),
          },
        ) as DomainEventEnvelope,
      )
    })

    expect(result.current.steps[1]!.status).toBe('failed')
    expect(result.current.steps[1]!.errorMessage).toBe('Could not parse')
    expect(result.current.steps[2]!.status).toBe('pending')
  })

  it('ignores events with a different processing_token', () => {
    const { result } = renderHook(() => useBriefBuilderWS(TOKEN))

    act(() => {
      capturedOptions.handlers['brief.processing.step_completed']!(
        envelope<BriefProcessingStepCompleted>(
          'brief.processing.step_completed',
          {
            processing_token: OTHER_TOKEN,
            step: 1,
            step_name: 'reading_website',
            step_label: 'Leyendo sitio web',
            total_steps: 5,
            step_status: 'completed',
            error_message: null,
            timestamp: new Date().toISOString(),
          },
        ) as DomainEventEnvelope,
      )
    })

    expect(result.current.steps[0]!.status).toBe('active')
  })

  it('sets briefDraft and status on completed event', () => {
    const { result } = renderHook(() => useBriefBuilderWS(TOKEN))

    act(() => {
      capturedOptions.handlers['brief.processing.completed']!(
        envelope<BriefProcessingCompleted>('brief.processing.completed', {
          processing_token: TOKEN,
          status: 'completed',
          brief_draft: MOCK_DRAFT,
          fields_filled_count: 6,
          fields_empty_count: 0,
          processing_sec: 12.5,
        }) as DomainEventEnvelope,
      )
    })

    expect(result.current.status).toBe('completed')
    expect(result.current.briefDraft).toEqual(MOCK_DRAFT)
  })

  it('ignores completed event with different token', () => {
    const { result } = renderHook(() => useBriefBuilderWS(TOKEN))

    act(() => {
      capturedOptions.handlers['brief.processing.completed']!(
        envelope<BriefProcessingCompleted>('brief.processing.completed', {
          processing_token: OTHER_TOKEN,
          status: 'completed',
          brief_draft: MOCK_DRAFT,
          fields_filled_count: 6,
          fields_empty_count: 0,
          processing_sec: 12.5,
        }) as DomainEventEnvelope,
      )
    })

    expect(result.current.status).toBe('pending')
    expect(result.current.briefDraft).toBeNull()
  })

  it('sets error info on failed event', () => {
    const { result } = renderHook(() => useBriefBuilderWS(TOKEN))

    act(() => {
      capturedOptions.handlers['brief.processing.failed']!(
        envelope<BriefProcessingFailed>('brief.processing.failed', {
          processing_token: TOKEN,
          error_code: 'ai_timeout',
          error_message: 'AI service timed out',
          retryable: true,
        }) as DomainEventEnvelope,
      )
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.errorCode).toBe('ai_timeout')
    expect(result.current.errorMessage).toBe('AI service timed out')
    expect(result.current.retryable).toBe(true)
  })

  it('ignores failed event with different token', () => {
    const { result } = renderHook(() => useBriefBuilderWS(TOKEN))

    act(() => {
      capturedOptions.handlers['brief.processing.failed']!(
        envelope<BriefProcessingFailed>('brief.processing.failed', {
          processing_token: OTHER_TOKEN,
          error_code: 'unknown',
          error_message: 'Something broke',
          retryable: false,
        }) as DomainEventEnvelope,
      )
    })

    expect(result.current.status).toBe('pending')
    expect(result.current.errorCode).toBeNull()
  })

  it('marks remaining steps completed on processing completed', () => {
    const { result } = renderHook(() => useBriefBuilderWS(TOKEN))

    act(() => {
      capturedOptions.handlers['brief.processing.step_completed']!(
        envelope<BriefProcessingStepCompleted>(
          'brief.processing.step_completed',
          {
            processing_token: TOKEN,
            step: 1,
            step_name: 'reading_website',
            step_label: 'Leyendo sitio web',
            total_steps: 5,
            step_status: 'completed',
            error_message: null,
            timestamp: new Date().toISOString(),
          },
        ) as DomainEventEnvelope,
      )
    })

    act(() => {
      capturedOptions.handlers['brief.processing.completed']!(
        envelope<BriefProcessingCompleted>('brief.processing.completed', {
          processing_token: TOKEN,
          status: 'completed',
          brief_draft: MOCK_DRAFT,
          fields_filled_count: 6,
          fields_empty_count: 0,
          processing_sec: 12.5,
        }) as DomainEventEnvelope,
      )
    })

    const allCompleted = result.current.steps.every(
      (s) => s.status === 'completed',
    )
    expect(allCompleted).toBe(true)
  })
})
