---
satisfies: [R6]
---

## Description

Completar el case `'changes.requested'` en `src/shared/ws/handlers.ts` (placeholder agregado en F.1). Dispara invalidaciones de TanStack Query para reflejar la nueva card en vivo (sin reload) en ambos lados de la conversation. Verifica regresión: `'draft.submitted'` (FEAT-007) sigue funcionando para v(n+1) sin cambios.

**Size:** S
**Files:**

- `src/shared/ws/handlers.ts` (modificar)
- `src/shared/ws/__tests__/handlers.test.ts` (extender)
- `tests/e2e/feat008/request-changes-single.spec.ts` (extender — afirmar live updates sin `page.reload()`)

## Approach

- En `handlers.ts`, dentro del case `'changes.requested'`:
  - Extraer `conversation_id` y `deliverable_id` del payload.
  - `queryClient.invalidateQueries({ queryKey: ['conversation-deliverables', conversation_id] })`.
  - `queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversation_id] })`.
  - `queryClient.invalidateQueries({ queryKey: ['change-requests', deliverable_id] })`.
- Verificar que `'draft.submitted'` (case existente FEAT-007) sigue invalidando `['conversation-deliverables', conversation_id]` + `['conversation-messages', conversation_id]` + `['drafts', deliverable_id]`. Sin cambios; solo regresión.
- Test unitario con `QueryClient` mock + WS event mock: assertar exact set de query keys invalidadas.
- E2E: dos pestañas brand abiertas en la misma conversation (una abre, otra está en background). Brand 1 envía request changes. Brand 2 recibe la card sin reload. Asimétrico: creator también recibe la card y el panel lateral refleja status `changes_requested` con botón "Upload draft v2" habilitado.

**Reuse points**:

- `QueryClient` global ya inyectado vía provider raíz.
- Patrón de invalidación establecido en FEAT-007 case `'draft.submitted'` y `'deliverable.changed'`.

## Investigation targets

**Required**:

- `src/shared/ws/handlers.ts` — switch existente, especialmente cases `'draft.submitted'` y `'deliverable.changed'`
- `src/shared/ws/useWebSocket.ts` — hook que dispatchea
- `src/integrations/tanstack-query/` — config del QueryClient

**Optional**:

- `src/shared/ws/__tests__/handlers.test.ts` — patrón de test existente

## Design context

No aplica — task de plomería WS.

## Acceptance

- [ ] Case `'changes.requested'` invalida exactamente las 3 query keys: `['conversation-deliverables', cid]`, `['conversation-messages', cid]`, `['change-requests', deliverableId]`.
- [ ] Test unitario con WS mock verifica el set exacto de invalidaciones.
- [ ] Regresión: case `'draft.submitted'` sigue invalidando las query keys originales sin cambios (test de regresión).
- [ ] E2E confirma que la `RequestChangesCard` aparece en ambas pestañas sin `page.reload()` y que el botón "Upload draft v2" del creator se habilita en vivo.
- [ ] `pnpm tsc --noEmit` pasa (exhaustive check del switch).

## Done summary

_Pendiente de implementación._

## Evidence

_Pendiente de implementación._
