# FEAT-004: Chat Messaging (text) — Frontend

## Overview

Frontend del chat 1:1 de texto entre `brand user` y `creator user` sobre la `Conversation` ya modelada en FEAT-003. Se agregan dos rutas anidadas (`_brand/workspace/conversations/$conversationId` y `_creator/workspace/conversations/$conversationId`) y un panel de chat (`<ConversationView/>`) con `<ConversationHeader/>`, `<MessageTimeline/>` virtualizada con scroll anchoring + paginación infinita hacia atrás, `<MessageBubble/>` (in/out, type=text), `<DaySeparator/>`, `<MessageComposer/>` (TanStack Form + Zod, 1..4096 chars con counter y paste-truncate), `<TypingIndicator/>`, `<PresenceBadge/>`, `<NewMessagesPill/>` y `<EmptyConversationFallback/>`.

Datos vía hooks Orval generados (`pnpm api:sync` contra el backend de dev) sobre los 4 endpoints REST nuevos: `POST/GET /conversations/{id}/messages`, `POST /conversations/{id}/read`, `GET /conversations/{id}`. Tiempo real vía WS multiplexado existente (FEAT-003) con 5 eventos nuevos: `message.created`, `message.read.batch`, `typing.started`, `typing.stopped`, `presence.updated` y reuso de `conversation.activity_updated`. Optimistic send con reconciliación por `client_message_id` (UUID v7) sobre el cache de TanStack Query; presence/typing en stores Zustand efímeros.

Backend (`marz-api`) entrega tasks B.1–B.10 en su propio epic; este epic asume B.8 (REST) y B.9 (WS) deployados en dev antes de F.1.

## Scope

In scope:

- Rutas anidadas brand/creator + `<ConversationView/>` con loaders prefetcheando detalle + primera página de mensajes.
- Timeline virtualizada con day separators, scroll anchoring on infinite-back, "new messages" pill cuando el viewport no está al fondo.
- Composer con validación Zod regenerada, counter visible >3500, paste-truncate a 4096, typing.ping debounced 1s.
- Optimistic send + reconciliación WS por `client_message_id`; retry on failure (3 intentos exponenciales) + resync forzado tras 5s sin confirmación (R-4 mitigación).
- Auto-mark-read al abrir + al recibir con viewport at-bottom (debounce 800ms); pill cuando viewport arriba.
- `<TypingIndicator/>` y `<PresenceBadge/>` con stores Zustand efímeros (no persisten).
- Counterpart inactive: composer disabled + tooltip; estado `disconnected` permanente en presence.
- Analytics fire-and-forget de 5 eventos.
- WS types union actualizado en `src/shared/ws/types.ts` con los 5 eventos nuevos.

Out of scope:

- Mobile (todas las pantallas son desktop-only en MVP).
- Attachments (`type='attachment'` se difiere a feature futura).
- Notificaciones push/email (Notifications context las consume vía `MessageSent`, fuera de este epic).
- Receipts visibles al emisor ("seen") — spec dura.
- Cualquier cambio en backend (`marz-api`) — vive en su epic propio.

## Approach

- Estructura por bounded context: `src/features/chat/{components,stores,ws,analytics}/`. No importar de `offers/`, `campaigns/` ni otros contextos; primitives reusables van a `shared/ui/`.
- Reuso del WS hub multiplexado existente (`src/shared/ws/useWebSocket.ts`); sólo se extiende la union `DomainWsEvent`.
- Reuso de `<ChatRailItem/>` y `<ConversationRail/>` de FEAT-003 sin cambios estructurales — el rail ya reacciona a `conversation.activity_updated` con `unread_count_delta`.
- Hooks Orval crudos envueltos en wrappers tipados con queryKeys consistentes: `['chat','conversation',id]`, `['chat','messages',id]`. Optimistic insert + reconciliación por `client_message_id` matching.
- Stores Zustand mínimos para presence/typing (efímeros). Pending outgoing NO va a Zustand, vive en TanStack Query con `status: 'pending'|'failed'|'confirmed'`.
- Virtualización: TanStack Virtual o `react-virtuoso` (decidir en F.4 con benchmark cualitativo). Scroll anchoring debe conservar posición visual ±10px tras `fetchPreviousPage`.
- Day separators calculados en hora local del usuario (today/yesterday/`DD MMM`).
- XSS: render como texto plano, nunca `dangerouslySetInnerHTML`.
- Tokens del `.pen` ya mapeados a Tailwind v4 en `src/styles.css`; bubbles, header y composer deben seguir frames `moaXA`/`FJAJJ` (brand) y `mRJ63`/`FthFP` (creator) del `marzv2.pen`.

## Quick commands

```bash
# Regenerar cliente API contra dev (post B.8 deployado)
pnpm api:sync

# Dev server
pnpm dev

# Typecheck + lint
pnpm typecheck && pnpm lint

# Tests unit
pnpm test

# E2E (Playwright pendiente; agregar como parte de F.3)
pnpm test:e2e -- chat
```

## Acceptance

- **R1:** Navegar a `/workspace/conversations/{id}` (brand o creator) renderiza header con `display_name`, avatar, `<PresenceBadge/>` reactivo y timeline con la última página de mensajes precargada por loader; 404/403 → `<EmptyConversationFallback/>`.
- **R2:** Timeline pagina hacia atrás vía scroll-up con `useMessagesInfiniteQuery`, conserva posición visual ±10px tras `fetchPreviousPage`, marca "inicio de la conversación" cuando `next_before_cursor=null`, y agrupa por día (today/yesterday/`DD MMM`) en hora local.
- **R3:** Composer envía mensaje con optimistic update (status=pending), reconcilia con `message.created` matching por `client_message_id` (un solo bubble), y permite retry tras failure; valida 1..4096 chars (Zod), bloquea envío vacío y trunca a 4096 al pegar.
- **R4:** Auto-mark-read se dispara al abrir conversación y al recibir mensaje del counterpart con viewport at-bottom + tab focused (debounce 800ms); con viewport arriba aparece `<NewMessagesPill/>` con contador, click → scroll bottom + auto-read; el badge unread del rail llega a 0 en <2s.
- **R5:** `<TypingIndicator/>` aparece <1s tras typing.ping del counterpart y desaparece <6s tras dejar de pinguear o al llegar `message.created` del mismo actor; composer pinguea con debounce 1s mientras hay actividad.
- **R6:** `<PresenceBadge/>` renderiza online/offline/disconnected leyendo `presenceStore`; transitions WS visibles en <30s; counterpart con `is_active=false` → estado `disconnected` permanente + composer disabled con tooltip "no se puede enviar".
- **R7:** WS types union `DomainWsEvent` incluye los 5 eventos nuevos + reuso de `conversation.activity_updated`; hook `useChatWsListeners(conversationId)` enruta cada uno a su handler con cobertura unit con WS mock.
- **R8:** Analytics emite `conversation_opened`, `message_sent`, `message_received_live`, `history_page_loaded`, `presence_state_changed` con shape esperado (unit tests del wrapper); fire-and-forget, no bloquea UX.
- **R9:** Sin XSS — render de `text_content` como texto plano (test que inyecta `<script>` y verifica que se muestra literal); avatar URL pre-signed S3 ya garantizada por backend.
- **R10:** Validación visual contra `marzv2.pen` ≥95% en header (`moaXA`/`mRJ63`) y bubbles in/out (`moaXA`); a11y: header con `aria-label="Conversation with {display_name}"`, bubbles con `aria-label` (autor + hora), composer con `<label>` + `aria-describedby` para counter.

## Early proof point

Task `fn-4-feat-004-chat-messaging-text-frontend.3` (Routes + `<ConversationView/>` shell) valida que el contrato Orval regenerado funciona end-to-end contra el backend de dev, que las dos rutas anidadas (brand y creator) montan correctamente bajo sus pathless route groups, y que el header con datos reales pinta el frame del `.pen`. Si falla, re-evaluar el contrato OpenAPI con backend (B.6/B.8) antes de seguir con timeline y composer.

## Requirement coverage

| Req | Description                                                            | Task(s)                                                                                                                                  | Gap justification |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| R1  | Rutas + ConversationView shell con header + timeline precargada        | fn-4-feat-004-chat-messaging-text-frontend.3                                                                                             | —                 |
| R2  | Timeline virtualizada + scroll anchoring + day separators + paginación | fn-4-feat-004-chat-messaging-text-frontend.4                                                                                             | —                 |
| R3  | Composer + optimistic send + reconciliación WS                         | fn-4-feat-004-chat-messaging-text-frontend.5                                                                                             | —                 |
| R4  | Auto-read + NewMessagesPill                                            | fn-4-feat-004-chat-messaging-text-frontend.6                                                                                             | —                 |
| R5  | TypingIndicator + typing.ping debounce                                 | fn-4-feat-004-chat-messaging-text-frontend.7                                                                                             | —                 |
| R6  | PresenceBadge + estado disconnected + composer disabled                | fn-4-feat-004-chat-messaging-text-frontend.7                                                                                             | —                 |
| R7  | WS types union + listeners                                             | fn-4-feat-004-chat-messaging-text-frontend.2                                                                                             | —                 |
| R8  | Analytics 5 eventos                                                    | fn-4-feat-004-chat-messaging-text-frontend.8                                                                                             | —                 |
| R9  | XSS safe + avatar pre-signed                                           | fn-4-feat-004-chat-messaging-text-frontend.4, fn-4-feat-004-chat-messaging-text-frontend.3                                               | —                 |
| R10 | Validación visual pencil + a11y                                        | fn-4-feat-004-chat-messaging-text-frontend.3, fn-4-feat-004-chat-messaging-text-frontend.4, fn-4-feat-004-chat-messaging-text-frontend.5 | —                 |

## References

- Solution doc (única fuente técnica): `marz-docs/features/FEAT-004-chat-messaging/03-solution.md`
- Spec de negocio: `marz-docs/features/FEAT-004-chat-messaging/02-spec.md`
- Frames `marzv2.pen`: brand `moaXA`/`FJAJJ`, creator `mRJ63`/`FthFP`; componentes `XxB84` (ChatRailItem), `xC7no`/`FdjGh` (MessageBubble), `xYQWa` (ChatHeaderActions)
- Convenciones repo: `marz-front/CLAUDE.md` (cliente Orval, WS, tokens, dos shells)
- Epic dependiente: `fn-3-feat-003-workspace-shell-conversation` (rail + workspace shell)
- Backend pareja: epic FEAT-004 en `marz-api` (B.1–B.10) — F.1 requiere B.8 deployado, F.2/F.5 requieren B.9, F.6 requiere B.5, F.7 requiere B.7
