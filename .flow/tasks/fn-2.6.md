# fn-2.6 F.3 — Hook useBriefBuilderWS + tipos WS manuales

## Description

# F.3 — Hook `useBriefBuilderWS` + tipos WS manuales

## Por qué

El backend pushea progreso del análisis IA via WS (`brief.processing.step_completed`, `brief.processing.completed`, `brief.processing.failed`). Estos tipos no vienen de OpenAPI y el hook tiene lógica específica del wizard (filtro por `processing_token`, agregación de `steps[]`).

## Scope

### Tipos

`src/shared/ws/brief-builder.types.ts`:

```ts
export type BriefProcessingStepName =
  | 'reading_website'
  | 'processing_description'
  | 'generating_icp'
  | 'generating_scoring'
  | 'generating_filters'

export interface BriefProcessingStepCompleted {
  processing_token: string
  step: 1 | 2 | 3 | 4 | 5
  step_name: BriefProcessingStepName
  step_label: string
  total_steps: 5
  step_status: 'completed' | 'failed'
  error_message: string | null
  timestamp: string
}

export interface BriefProcessingCompleted {
  processing_token: string
  status: 'completed' | 'partial' | 'failed'
  brief_draft: BriefDraft
  fields_filled_count: number
  fields_empty_count: number
  processing_sec: number
}

export interface BriefProcessingFailed {
  processing_token: string
  error_code:
    | 'website_unreachable'
    | 'pdf_extraction_failed'
    | 'ai_timeout'
    | 'unknown'
  error_message: string
  retryable: boolean
}
```

`BriefDraft` debería venir de Orval generado (`pnpm api:sync` cuando B.10 esté). Si no está, definir manualmente y migrar luego.

### Hook

`src/features/campaigns/brief-builder/hooks/useBriefBuilderWS.ts`:

```ts
type ProcessingStep = {
  step: 1 | 2 | 3 | 4 | 5
  name: BriefProcessingStepName
  label: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  errorMessage?: string
}

function useBriefBuilderWS(processingToken: string | null): {
  steps: ProcessingStep[]
  status: 'pending' | 'completed' | 'partial' | 'failed'
  briefDraft: BriefDraft | null
  errorCode: string | null
  errorMessage: string | null
  retryable: boolean
}
```

Implementación:

- Llama `useWebSocket({ enabled: processingToken != null, handlers })`.
- Handlers para los 3 event types.
- Filtra por `payload.processing_token === processingToken`.
- Mantiene `steps[]` con los 5 steps en orden, mutando estado conforme llegan eventos.
- Stable refs para handlers (evitar re-suscribir en cada render — patrón `useRef(handler).current` per react.dev).

### Tests

- `useBriefBuilderWS.test.ts`:
  - Sin token → `enabled=false`, no se conecta.
  - Step events actualizan `steps[i].status`.
  - Eventos con otro `processing_token` se ignoran.
  - `completed` event setea `briefDraft` + `status='completed'`.
  - `failed` event setea `errorCode/errorMessage/retryable`.

Mock del WS: usar `vi.mock('#/shared/ws/useWebSocket', ...)` (no abrir socket real).

## Notas

- Sin reconexión con backoff (efímero — si cae, retry es responsabilidad del usuario en F.4).
- StrictMode-safe: connect/disconnect idempotente.

## Acceptance

- `brief-builder.types.ts` exporta los 3 tipos de payload + `BriefProcessingStepName`.
- `useBriefBuilderWS` retorna `{ steps, status, briefDraft, errorCode, errorMessage, retryable }`.
- Filtra correctamente por `processing_token`; eventos de otro token se ignoran.
- 5+ tests verdes cubriendo: sin token, step events, otro-token, completed, failed.
- Sin race condition en handlers (stable ref pattern).
- `enabled` se pasa al `useWebSocket` correctamente (no abre socket sin token).

## Done summary
El único cambio funcional es el eslint-disable en la línea 23 del test, que es la solución correcta para el patrón vi.mock + import post-mock de Vitest. El resto del diff es metadata .flow/. Sin issues.
## Evidence
- Commits:
- Tests:
- PRs: