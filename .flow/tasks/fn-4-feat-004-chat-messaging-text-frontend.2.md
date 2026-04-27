---
satisfies: [R7]
---

## Description

Extender la union `DomainWsEvent` con los 5 eventos nuevos del chat (`message.created`, `message.read.batch`, `typing.started`, `typing.stopped`, `presence.updated`) y crear el hook `useChatWsListeners(conversationId)` que registra los handlers correspondientes durante el ciclo de vida del componente. Reuso del WS hub multiplexado existente sin abrir conexiones nuevas.

**Size:** M
**Files:**

- `src/shared/ws/types.ts` — union ampliada
- `src/shared/ws/useWebSocket.ts` — sólo si hace falta exponer subscribe/unsubscribe tipado
- `src/features/chat/ws/listeners.ts` — handlers genéricos
- `src/features/chat/ws/useChatWsListeners.ts` — hook que enruta eventos
- `src/features/chat/ws/types.ts` — tipos chat-only si conviene aislar
- `src/features/chat/ws/__tests__/useChatWsListeners.test.tsx` — unit tests con WS mock

## Approach

- Ampliar la union `DomainWsEvent` siguiendo el shape documentado en solution doc §4.2.1–§4.2.5.
- El hook se subscribe/unsubscribe al topic `conversation:{id}` cuando monta/desmonta enviando frames `{type:'subscribe', topic:'conversation', conversation_id}` y `{type:'unsubscribe', ...}`.
- Cada listener delega el efecto concreto a callbacks inyectados o a hooks del feature (e.g. cache TanStack Query, stores Zustand) — este task no implementa optimistic ni stores; solo cablea el ruteo.
- Tests: WS mock que emite cada uno de los 5 eventos y verifica que el handler correspondiente se invoca con el payload esperado.

## Investigation targets

**Required:**

- `src/shared/ws/useWebSocket.ts` — hook actual, contrato `DomainEventEnvelope`
- `src/shared/ws/types.ts` — union actual con `conversation.activity_updated` (FEAT-003)
- Solution doc `marz-docs/features/FEAT-004-chat-messaging/03-solution.md` §4.2 — payloads exactos de los 5 eventos
- FEAT-003 epic spec — cómo se cablearon los listeners del rail (patrón a seguir)

## Key context

- No invertir el lifecycle: el WS hub global ya existe; este hook solo se "engancha". No abrir un WS nuevo por componente.
- `typing.ping`/`typing.stop` (client→server) NO van acá — son responsabilidad del composer (F.5/F.7).
- `conversation.activity_updated` ya está cableado por FEAT-003 sobre el rail; este hook NO lo duplica en la vista del chat.

## Acceptance

- [ ] Union `DomainWsEvent` incluye los 5 eventos nuevos con payloads tipados.
- [ ] `useChatWsListeners(conversationId)` envía subscribe al montar y unsubscribe al desmontar.
- [ ] Cada uno de los 5 eventos enruta a su handler con cobertura unit (WS mock).
- [ ] `pnpm typecheck` verde sin `any` en la union.

## Done summary
Tres fixes aplicados correctamente: (1) ConversationActivityUpdatedPayload agregado a DomainWsEvent con tipado coherente; (2) ChatEventTypes derivado de DomainWsEvent elimina el dead-code tipado; (3) guard de runtime en makeConversationGuard verifica conversation_id antes del cast. Comentario en useChatWsListeners documenta la limitación conocida sin ser ruido. Sin issues funcionales.
## Evidence
- Commits:
- Tests:
- PRs: