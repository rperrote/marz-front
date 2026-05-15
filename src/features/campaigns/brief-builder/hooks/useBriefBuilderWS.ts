import { useEffect, useReducer, useRef, useCallback, useState } from 'react'
import { t } from '@lingui/core/macro'
import type { DomainEventEnvelope, EventHandler } from '#/shared/ws/events'
import { SubscribeError, useWebSocket } from '#/shared/ws/useWebSocket'
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

function getStepLabels(): Record<BriefProcessingStepName, string> {
  return {
    reading_website: t`Leyendo sitio web`,
    processing_description: t`Procesando descripción`,
    generating_icp: t`Generando ICP`,
    generating_scoring: t`Generando scoring`,
    generating_filters: t`Generando filtros`,
  }
}

function buildInitialSteps(): ProcessingStep[] {
  const STEP_LABELS = getStepLabels()
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
  subscribed: boolean
}

export function useBriefBuilderWS(
  processingToken: string | null,
): BriefBuilderWSResult {
  const [state, dispatch] = useReducer(briefBuilderWSReducer, undefined, () =>
    buildInitialBriefBuilderWSState(),
  )

  const tokenRef = useRef(processingToken)
  tokenRef.current = processingToken
  const subscribedTokenRef = useRef<string | null>(null)
  // Bumped when a subscribe attempt fails transiently (not_connected /
  // already_subscribing under React StrictMode double-mount) so the effect
  // re-runs and retries on the now-open socket.
  const [subscribeAttempt, setSubscribeAttempt] = useState(0)

  const handleStepCompleted: EventHandler = useCallback(
    (envelope: DomainEventEnvelope) => {
      const payload = envelope.payload as BriefProcessingStepCompleted
      if (payload.processing_token !== tokenRef.current) return

      dispatch({ type: 'stepCompleted', payload })
    },
    [],
  )

  const handleCompleted: EventHandler = useCallback(
    (envelope: DomainEventEnvelope) => {
      const payload = envelope.payload as BriefProcessingCompleted
      if (payload.processing_token !== tokenRef.current) return

      const incoming = payload.brief_draft
      // The backend only emits the AI-generated `brief` portion; the user fills
      // `campaign` in P4. Initialize it with empty defaults so P3Review can
      // render before the user has touched it.
      if (!incoming.campaign) {
        incoming.campaign = {
          name: '',
          objective: '',
          budget_amount: null,
          budget_currency: 'USD',
          deadline: '',
        }
      }
      incoming.brief.scoring_dimensions = incoming.brief.scoring_dimensions.map(
        (d) => ({
          ...d,
          id: d.id || crypto.randomUUID(),
        }),
      )
      incoming.brief.hard_filters = incoming.brief.hard_filters.map((f) => ({
        ...f,
        id: f.id || crypto.randomUUID(),
      }))
      dispatch({
        type: 'completed',
        payload: { ...payload, brief_draft: incoming },
      })
    },
    [],
  )

  const handleFailed: EventHandler = useCallback(
    (envelope: DomainEventEnvelope) => {
      const payload = envelope.payload as BriefProcessingFailed
      if (payload.processing_token !== tokenRef.current) return

      dispatch({ type: 'failed', payload })
    },
    [],
  )

  const {
    status: wsStatus,
    subscribe,
    unsubscribe,
  } = useWebSocket({
    enabled: processingToken != null,
    handlers: {
      'campaigns.brief.processing.step_completed': handleStepCompleted,
      'campaigns.brief.processing.completed': handleCompleted,
      'campaigns.brief.processing.failed': handleFailed,
    },
  })

  useEffect(() => {
    if (processingToken == null) {
      subscribedTokenRef.current = null
      dispatch({ type: 'subscribed', subscribed: false })
      return
    }
    if (wsStatus !== 'open') return
    if (subscribedTokenRef.current === processingToken) return

    subscribedTokenRef.current = processingToken
    let cancelled = false
    let didSubscribe = false
    void subscribe('brief-builder', { processing_token: processingToken })
      .then(() => {
        if (cancelled) return
        if (tokenRef.current !== processingToken) return
        didSubscribe = true
        dispatch({ type: 'subscribed', subscribed: true })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (tokenRef.current !== processingToken) return
        const code = err instanceof SubscribeError ? err.code : 'internal'
        // not_connected/already_subscribing are transient under React StrictMode
        // double-mount in dev: the first effect mounts before the socket finishes
        // opening, fails, and we'd surface a fatal UI error. Clear the ref and
        // bump the attempt counter so the effect re-runs against the now-open
        // socket on the next tick.
        if (code === 'not_connected' || code === 'already_subscribing') {
          subscribedTokenRef.current = null
          setTimeout(() => {
            if (cancelled) return
            setSubscribeAttempt((n) => n + 1)
          }, 50)
          return
        }
        dispatch({
          type: 'subscribeFailed',
          code,
          message: getSubscribeErrorMessage(code),
        })
      })

    return () => {
      cancelled = true
      subscribedTokenRef.current = null
      if (didSubscribe) {
        unsubscribe('brief-builder')
      }
    }
  }, [wsStatus, processingToken, subscribe, unsubscribe, subscribeAttempt])

  return {
    steps: state.steps,
    status: state.status,
    briefDraft: state.briefDraft,
    errorCode: state.errorCode,
    errorMessage: state.errorMessage,
    retryable: state.retryable,
    subscribed: state.subscribed,
  }
}

interface BriefBuilderWSState {
  steps: ProcessingStep[]
  status: ProcessingStatus
  briefDraft: BriefDraft | null
  errorCode: string | null
  errorMessage: string | null
  retryable: boolean
  subscribed: boolean
}

type BriefBuilderWSAction =
  | { type: 'stepCompleted'; payload: BriefProcessingStepCompleted }
  | { type: 'completed'; payload: BriefProcessingCompleted }
  | { type: 'failed'; payload: BriefProcessingFailed }
  | { type: 'subscribed'; subscribed: boolean }
  | { type: 'subscribeFailed'; code: string; message: string }

function buildInitialBriefBuilderWSState(): BriefBuilderWSState {
  return {
    steps: buildInitialSteps(),
    status: 'pending',
    briefDraft: null,
    errorCode: null,
    errorMessage: null,
    retryable: false,
    subscribed: false,
  }
}

function briefBuilderWSReducer(
  state: BriefBuilderWSState,
  action: BriefBuilderWSAction,
): BriefBuilderWSState {
  switch (action.type) {
    case 'stepCompleted':
      return {
        ...state,
        steps: state.steps.map((step) => {
          if (step.step === action.payload.step) {
            return {
              ...step,
              label: action.payload.step_label,
              status: action.payload.step_status,
              errorMessage: action.payload.error_message ?? undefined,
            }
          }
          if (
            step.step === action.payload.step + 1 &&
            action.payload.step_status === 'completed'
          ) {
            return { ...step, status: 'active' }
          }
          return step
        }),
      }
    case 'completed':
      return {
        ...state,
        status: action.payload.status,
        briefDraft: {
          ...action.payload.brief_draft,
          campaign: action.payload.brief_draft.campaign ?? {
            name: '',
            objective: '',
            budget_amount: null,
            budget_currency: '',
            deadline: '',
          },
        },
        steps: state.steps.map((step) =>
          step.status === 'active' || step.status === 'pending'
            ? { ...step, status: 'completed' }
            : step,
        ),
      }
    case 'failed':
      if (
        state.status === 'failed' &&
        state.errorCode === action.payload.error_code &&
        state.errorMessage === action.payload.error_message &&
        state.retryable === action.payload.retryable
      ) {
        return state
      }
      return {
        ...state,
        status: 'failed',
        errorCode: action.payload.error_code,
        errorMessage: action.payload.error_message,
        retryable: action.payload.retryable,
      }
    case 'subscribed':
      if (state.subscribed === action.subscribed) {
        return state
      }
      return { ...state, subscribed: action.subscribed }
    case 'subscribeFailed':
      if (
        state.status === 'failed' &&
        state.errorCode === action.code &&
        state.errorMessage === action.message &&
        state.retryable === false
      ) {
        return state
      }
      return {
        ...state,
        status: 'failed',
        errorCode: action.code,
        errorMessage: action.message,
        retryable: false,
      }
  }
}

function getSubscribeErrorMessage(code: string): string {
  switch (code) {
    case 'token_not_found':
      return t`El análisis no existe o expiró. Volvé al formulario.`
    case 'ownership_error':
      return t`No tenés permiso sobre este análisis.`
    case 'invalid_payload':
      return t`No se pudo iniciar la suscripción al análisis.`
    case 'timeout':
      return t`No se pudo conectar al análisis. Volvé a intentar.`
    case 'disconnected':
      return t`Se perdió la conexión con el servidor.`
    default:
      return t`Ocurrió un error al conectar con el servidor.`
  }
}
