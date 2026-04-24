# fn-2.7 F.4 — Fase 2: progreso WS de 5 steps + retry/back

## Description

# F.4 — Fase 2: progreso WS de 5 steps + retry/back

## Por qué

Pantalla de espera con feedback en tiempo real del análisis IA (5 pasos). Al completar avanza a Fase 3 con el `briefDraft`.

## Scope

### Componentes

- `src/features/campaigns/brief-builder/screens/P2Progress.tsx`.
- `src/features/campaigns/brief-builder/components/BriefProcessingStep.tsx` — fila visual de un paso (instancia el organismo diseñado en F.0b).

### Comportamiento

Lee `processingToken` del store, llama `useBriefBuilderWS(processingToken)` (F.3).

Renderiza 5 `BriefProcessingStep` con estado:

- `pending` — gris.
- `active` — animación de spinner/pulse.
- `completed` — check verde (`--success`).
- `failed` — X rojo (`--destructive`) + `errorMessage` debajo.

Steps 4 y 5 pueden mostrarse con animación de delay UI (250ms entre push) si los events llegan agrupados (el backend genera 3, 4, 5 con delays según spec).

### Transiciones

- `status === 'completed' || 'partial'`: `setField('briefDraft', briefDraft)` y `goTo(3)`.
- `status === 'failed'`:
  - Renderizar pantalla de error con `errorMessage`.
  - Botón "Reintentar" disabled si `retryable === false`. On click: `useProcessBrief.mutate({ processing_token })` de nuevo.
  - Botón "Volver al formulario": `goTo(1)` conservando datos.

### Tests

- `P2Progress.test.tsx`:
  - Steps actualizados al llegar WS events (mockear `useBriefBuilderWS`).
  - `completed` → `goTo(3)` invoked + `briefDraft` guardado en store.
  - `failed` muestra error actions.
  - "Reintentar" disabled si `retryable=false`.
  - "Reintentar" llama `useProcessBrief` cuando habilitado.

## Notas

- Depende de F.3 (hook) y F.1 (store/ruta). En dev, el backend (B.7) puede no estar — mockear el hook directamente para verificar UI.
- El `aria-live="polite"` en el contenedor de steps anuncia cambios para screen readers.

## Acceptance

- 5 BriefProcessingStep renderizados en orden correcto.
- Estados visuales: pending, active, completed, failed (con error message).
- Al recibir `completed` el wizard navega a Phase 3 con `briefDraft` en el store.
- Al recibir `failed`: muestra error + 2 CTAs ("Reintentar" condicional a retryable, "Volver").
- "Reintentar" llama `POST /process` de nuevo si `retryable=true`.
- "Volver" → Phase 1 con datos originales del store conservados.
- Tests: 5+ casos cubriendo step updates, completion, failure, retry, back.
- `aria-live` presente para anuncios de screen reader.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:
