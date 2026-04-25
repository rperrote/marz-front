import { useRef, useState, useCallback } from 'react'
import type { DomainEventEnvelope, EventHandler } from '#/shared/ws/events'
import { useWebSocket } from '#/shared/ws/useWebSocket'
import type { BriefDraft } from '#/features/campaigns/brief-builder/store'
import type {
  BriefProcessingStepName,
  BriefProcessingStepCompleted,
  BriefProcessingCompleted,
  BriefProcessingFailed,
} from '#/features/campaigns/brief-builder/brief-builder.types'

export type ProcessingStepStatus = 'pending' | 'active' | 'completed' | 'failed'

export interface ProcessingStep {
  step: 1 | 2 | 3 | 4 | 5
  name: BriefProcessingStepName
  label: string
  status: ProcessingStepStatus
  errorMessage?: string
}

export type ProcessingStatus = 'pending' | 'completed' | 'partial' | 'failed'

const STEP_NAMES: BriefProcessingStepName[] = [
  'reading_website',
  'processing_description',
  'generating_icp',
  'generating_scoring',
  'generating_filters',
]

const STEP_LABELS: Record<BriefProcessingStepName, string> = {
  reading_website: 'Leyendo sitio web',
  processing_description: 'Procesando descripción',
  generating_icp: 'Generando ICP',
  generating_scoring: 'Generando scoring',
  generating_filters: 'Generando filtros',
}

function buildInitialSteps(): ProcessingStep[] {
  return STEP_NAMES.map((name, i) => ({
    step: (i + 1) as 1 | 2 | 3 | 4 | 5,
    name,
    label: STEP_LABELS[name],
    status: i === 0 ? 'active' : 'pending',
  }))
}

interface BriefBuilderWSResult {
  steps: ProcessingStep[]
  status: ProcessingStatus
  briefDraft: BriefDraft | null
  errorCode: string | null
  errorMessage: string | null
  retryable: boolean
}

export function useBriefBuilderWS(
  processingToken: string | null,
): BriefBuilderWSResult {
  const [steps, setSteps] = useState<ProcessingStep[]>(buildInitialSteps)
  const [status, setStatus] = useState<ProcessingStatus>('pending')
  const [briefDraft, setBriefDraft] = useState<BriefDraft | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryable, setRetryable] = useState(false)

  const tokenRef = useRef(processingToken)
  tokenRef.current = processingToken

  const handleStepCompleted: EventHandler = useCallback(
    (envelope: DomainEventEnvelope) => {
      const payload = envelope.payload as BriefProcessingStepCompleted
      if (payload.processing_token !== tokenRef.current) return

      setSteps((prev) =>
        prev.map((s) => {
          if (s.step === payload.step) {
            return {
              ...s,
              label: payload.step_label,
              status: payload.step_status,
              errorMessage: payload.error_message ?? undefined,
            }
          }
          if (
            s.step === payload.step + 1 &&
            payload.step_status === 'completed'
          ) {
            return { ...s, status: 'active' }
          }
          return s
        }),
      )
    },
    [],
  )

  const handleCompleted: EventHandler = useCallback(
    (envelope: DomainEventEnvelope) => {
      const payload = envelope.payload as BriefProcessingCompleted
      if (payload.processing_token !== tokenRef.current) return

      const incoming = payload.brief_draft
      incoming.brief.scoring_dimensions = incoming.brief.scoring_dimensions.map(
        (d) => ({
          ...d,
          id: d.id || crypto.randomUUID(),
        }),
      )
      setBriefDraft(incoming)
      setStatus(payload.status)

      setSteps((prev) =>
        prev.map((s) =>
          s.status === 'active' || s.status === 'pending'
            ? { ...s, status: 'completed' }
            : s,
        ),
      )
    },
    [],
  )

  const handleFailed: EventHandler = useCallback(
    (envelope: DomainEventEnvelope) => {
      const payload = envelope.payload as BriefProcessingFailed
      if (payload.processing_token !== tokenRef.current) return

      setStatus('failed')
      setErrorCode(payload.error_code)
      setErrorMessage(payload.error_message)
      setRetryable(payload.retryable)
    },
    [],
  )

  useWebSocket({
    enabled: processingToken != null,
    handlers: {
      'brief.processing.step_completed': handleStepCompleted,
      'brief.processing.completed': handleCompleted,
      'brief.processing.failed': handleFailed,
    },
  })

  return { steps, status, briefDraft, errorCode, errorMessage, retryable }
}
