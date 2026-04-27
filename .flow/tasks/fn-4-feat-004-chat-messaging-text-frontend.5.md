---
satisfies: [R3, R10]
---

## Description

`<MessageComposer/>` con TanStack Form + Zod regenerado, counter visible >3500, paste-truncate a 4096 con toast informativo, y `useSendMessageMutation` con optimistic update sobre `['chat','messages',id]` reconciliada por `client_message_id` cuando llega el WS `message.created`. Retry on failure (3 intentos exponenciales) + resync forzado tras 5s sin confirmación (mitigación R-4 del solution doc).

**Size:** M
**Files:**

- `src/features/chat/components/MessageComposer.tsx`
- `src/features/chat/mutations/useSendMessageMutation.ts`
- `src/features/chat/utils/clientMessageId.ts` — UUID v7 generator (o reuso si existe en repo)
- `src/features/chat/ws/messageCreatedHandler.ts` — reconciliación pending → confirmed
- `src/features/chat/components/__tests__/MessageComposer.test.tsx`
- `src/features/chat/mutations/__tests__/useSendMessageMutation.test.tsx`
- E2E `chat-send-receive.spec.ts`

## Approach

- TanStack Form con campo `text` validado por el schema Zod regenerado (`MessageSendRequestSchema`).
- Counter visible cuando `text.length > 3500`. Bloquear submit con `text.trim().length === 0`. Bloquear keystrokes >4096 + paste truncado a 4096 con toast.
- Generar `client_message_id` (UUID v7) antes del POST. Optimistic insert en `['chat','messages',id]` con `id=client_message_id`, `status='pending'`, `text_content=text`, `author_account_id=self`, `created_at=clientNow`.
- Mutación post → 201 con `message` autoritativo + `idempotent_replay`. Retry exponencial (3 intentos) en errores 5xx/network; 422 NO se retry-ea (toast + mark failed).
- Reconciliación: el handler de `message.created` (registrado en F.2) busca el mensaje pending por `client_message_id` y lo reemplaza con la versión confirmed. Si tras 5s no llegó el WS, refetch `['chat','messages',id]` para resyncar (R-4).
- `typing.stopped` se emite desde el server al recibir el send (solution doc §4.2.4); el composer NO necesita enviarlo manualmente.
- Disable composer cuando `conversationDetail.can_send=false` con tooltip "no se puede enviar" (counterpart inactivo).
- A11y: `<label>` para el textarea + `aria-describedby` apuntando al counter.

## Investigation targets

**Required:**

- Solution doc §4.1.1 (POST /messages: request, response, errores, idempotencia)
- Solution doc §7.4 (hooks Orval) y §7.5 (suscripciones WS)
- Solution doc §11 R-4 (mitigación de optimistic stuck)
- `src/shared/api/generated/zod/` — `MessageSendRequestSchema` regenerado en F.1
- `src/features/chat/queries.ts` (F.3) — para los queryKeys
- Repos similares con TanStack Form + optimistic en el frontend (FEAT-001 onboarding tiene mutaciones similares)

## Design context

Frames `marzv2.pen` brand `moaXA`/`FJAJJ`, creator `mRJ63`/`FthFP` — composer con corner radius generoso, fill surface neutral, primary fill en el botón send.

Counter como utility text token (`text-muted-foreground`); transición suave a `text-warning` cerca del límite.

## Key context

- UUID v7 lleva timestamp embebido — usar la lib del ecosistema (uuid v9+ con `v7()`) o equivalente. Validar formato antes de enviar (la regen Zod ya cubre el server, pero el cliente debe asegurar formato válido).
- Server idempotencia: reintento del mismo `client_message_id` <24h devuelve la misma `id` con `idempotent_replay=true`. La UI no necesita tratarlo distinto al happy path; solo NO duplicar el bubble.
- Reconciliación matching: el handler debe buscar por `client_message_id` (no por `id`, que es nuevo) en el cache de TanStack Query.
- 422 `validation.text_too_long` debería ser imposible si el composer trunca; pero si llega, mostrar toast + mark failed (defensa en profundidad).

## Acceptance

- [ ] Enviar mensaje aparece instantáneo con `status='pending'`, confirma en <2s con `message.created` matching, queda un solo bubble.
- [ ] 422 server → toast + bubble en `status='failed'` con botón retry.
- [ ] 5xx/network → 3 retries exponenciales; tras agotar, mark failed.
- [ ] Tras 5s sin `message.created` matching → refetch del cache (mitigación R-4).
- [ ] Composer deshabilita submit con texto vacío/whitespace; bloquea keystrokes >4096; trunca paste >4096 con toast.
- [ ] Counter visible >3500 caracteres.
- [ ] `can_send=false` → composer disabled con tooltip.
- [ ] E2E `chat-send-receive`: 2 sesiones, A envía, B (suscrito) ve el mensaje en <2s.
- [ ] A11y: `<label>` + `aria-describedby` para counter; render texto plano (XSS test cubierto en F.4 sigue verde).

## Done summary

Todos los fixes aplicados correctamente. TanStack Form + Zod reemplaza el useState manual. read_by_self calculado dinámicamente desde currentAccountId. createPendingMessage acepta nowIso inyectable. Tests cubren retry 422, timeout WS y read_by_self propio. Contexto accountId propagado correctamente del beforeLoad padre a la ruta hija via useRouteContext.

## Evidence

- Commits:
- Tests:
- PRs:
