---
satisfies: [R5]
---

## Description

Hook `useWorkspaceRailSubscription` que se suscribe al topic WS `workspace_rail` y aplica patches a la cache de `['conversations']` cuando llega `conversation.activity_updated`. Sin refetch.

**Size:** M
**Files:**

- `src/features/chat/workspace/useWorkspaceRailSubscription.ts` (nuevo)
- `src/features/chat/workspace/conversationRailPatcher.ts` (nuevo, helper puro)
- Modificación: `src/features/chat/workspace/WorkspaceLayout.tsx` (mount del hook) o `ConversationRail.tsx`
- Modificación menor: `src/shared/ws/useWebSocket.ts` si hace falta exponer un mensaje de subscribe (chequear API actual)
- Tests co-located

## Approach

- Hook recibe `queryClient` (via `useQueryClient`) y registra un handler para `event_type === 'conversation.activity_updated'` en `useWebSocket({ handlers: {...}, enabled: true })`.
- Al mount, enviar `{ type: 'subscribe', topic: 'workspace_rail' }`. Patrón: agregar un `send` exposto por `useWebSocket` (revisar; si no existe, extender).
- Patcher puro `applyActivityUpdate(infiniteData, eventPayload, requesterAccountId) → InfiniteData`:
  - Busca el `conversation_id` en todas las páginas.
  - Si no está → return data sin cambios (no-op).
  - Si está → mueve la entry al top de la primera página, actualiza `last_activity_at`, `last_message_preview`, suma `unread_count_delta` solo si `author_is_self === false`.
- `queryClient.setQueriesData({ queryKey: ['conversations'] }, patcher)` aplica a todas las variantes de filtros.
- Invalidate on window focus + on WS reconnect (R-3 mitigation): `queryClient.invalidateQueries({ queryKey: ['conversations'] })` cuando el hook detecte reopen del socket.

## Investigation targets

**Required:**

- `src/shared/ws/useWebSocket.ts` — API actual y cómo extender para enviar mensajes
- `src/shared/ws/events.ts` — `DomainEventEnvelope` shape
- `marz-docs/features/FEAT-003-workspace-shell/03-solution.md` §4.2 §7.5 §11 R-3
- TanStack Query docs: `setQueriesData` con `InfiniteData`

## Acceptance

- [ ] Hook se suscribe a `workspace_rail` al mount, desuscribe al unmount.
- [ ] `conversation.activity_updated` con `conversation_id` en cache → entry sube al top, `unread_count` correcto.
- [ ] Mismo evento con `conversation_id` ausente del cache → no-op (no fuerza refetch).
- [ ] `unread_count_delta` solo se suma si `author_is_self === false`.
- [ ] On WS reopen / window focus: invalidate `['conversations']`.
- [ ] Tests unit del patcher (función pura) cubren los casos: presente/ausente, author_is_self true/false, multipage.
- [ ] Test del hook con WS mock: emit del evento → cache actualizada.
- [ ] `pnpm typecheck` y `pnpm lint` verdes.

## Done summary

_To be filled by the worker on completion._

## Evidence

_To be filled by the worker on completion (commands run, test output, screenshots, etc.)._
