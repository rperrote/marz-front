---
satisfies: [R5, R6]
---

## Description

Agregar handlers para los 4 nuevos `event_type` WS (`draft.submitted`, `draft.approved`, `deliverable.changed`, `stage.approved`) en `src/shared/ws/handlers.ts` con sus invalidaciones / `setQueryData` correspondientes en TanStack Query. La UI debe actualizarse en vivo sin reload.

**Size:** S (un archivo + tests)
**Files:**

- `src/shared/ws/handlers.ts` (modificar)
- `src/shared/ws/__tests__/handlers.test.ts` (nuevo o extender existente)

## Approach

`handlers.ts` ya tiene un switch sobre `envelope.event_type` (FEAT-003/004). Agregar 4 cases:

- `'draft.submitted'`:
  - `queryClient.invalidateQueries({ queryKey: ['conversation-deliverables', payload.conversation_id] })`
  - `queryClient.invalidateQueries({ queryKey: ['conversation-messages', payload.conversation_id] })`
  - Las query keys reales pueden diferir según cómo Orval generó las query keys; usar `getGetConversationDeliverablesQueryKey({ conversationId })` exportado por Orval para mantener consistencia.

- `'draft.approved'`: idem set de invalidaciones.

- `'deliverable.changed'`: usar `setQueryData` optimista en `['conversation-deliverables', conversation_id]` para evitar flash. Mergear el `deliverable` actualizado del payload sobre el array cached. Si la query no está en cache (no hay subscriber activo), no hacer nada.

- `'stage.approved'`:
  - Invalidate `['conversation-deliverables', conversation_id]`.
  - Invalidate `['offer', payload.offer_id]` (FEAT-006 usa esa key).

**`'stage.opened'` ya existe** desde FEAT-006 — verificar que NO se duplica el handler. Si existe pero no invalida `['conversation-deliverables', ...]`, agregar esa invalidación al case existente.

**Sobre query keys:** preferir leer las funciones generadas por Orval (`getXxxQueryKey({...})`) en lugar de strings literales, para evitar drift cuando Orval cambia el formato.

## Investigation targets

**Required:**

- `src/shared/ws/handlers.ts` — switch actual y patrón de invalidate
- `src/shared/ws/useWebSocket.ts` — cómo se conecta el handler al hook
- `src/shared/api/generated/endpoints.ts` (post-F.1) — funciones `getXxxQueryKey` exportadas
- `src/shared/ws/types.ts` (post-F.1) — los nuevos payload types (necesitamos hacer narrowing por discriminated union)
- `marz-docs/features/FEAT-007-draft-submit-review/03-solution.md` §4.2 (shapes WS)

**Optional:**

- Casos similares de FEAT-006 (handler de `stage.opened` o `offer.accepted`) — para reusar patrón de invalidaciones cross-context.

## Key context

- WS dedupea por `event_id` antes de llegar al handler — no agregar dedupe local.
- `at-least-once`: el mismo event puede llegar dos veces. Las invalidaciones son idempotentes; el `setQueryData` también lo es siempre que se mergee por id.
- El `setQueryData` para `deliverable.changed` debe usar `produce` (Immer) o spread inmutable — la query key value es un array, no clonarlo a mano.

## Acceptance

- [ ] Los 4 nuevos `event_type` están manejados en el switch de `handlers.ts`.
- [ ] Cada handler usa las funciones de query key exportadas por Orval (no strings literales).
- [ ] `deliverable.changed` usa `setQueryData` optimista (no invalidate).
- [ ] El handler de `stage.opened` (existente o nuevo) invalida `['conversation-deliverables', ...]`.
- [ ] Tests con WS mock cubren los 4 event types y verifican las query keys invalidadas / actualizadas.
- [ ] Test de integración: dos pestañas brand abiertas en la misma conversation; un creator submitea; ambas pestañas brand reciben la card sin reload (puede ser unit con dos `QueryClient` instances + handler invocado manualmente).
- [ ] `pnpm tsc --noEmit` y `pnpm lint` pasan.

## Done summary

_To be filled by the worker._

## Evidence

_Logs, screenshots, or test output go here._
