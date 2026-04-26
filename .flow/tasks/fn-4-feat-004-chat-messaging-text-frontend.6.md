---
satisfies: [R4]
---

## Description

Auto-mark-read al abrir conversación y al recibir `message.created` del counterpart con viewport at-bottom + tab focused (debounce 800ms). `<NewMessagesPill/>` flotante "↓ N mensajes nuevos" cuando llega un mensaje y el viewport NO está al fondo; click → scroll-to-bottom + auto-read.

**Size:** M
**Files:**

- `src/features/chat/components/NewMessagesPill.tsx`
- `src/features/chat/mutations/useMarkConversationReadMutation.ts`
- `src/features/chat/hooks/useAutoMarkRead.ts`
- `src/features/chat/hooks/useViewportAtBottom.ts`
- `src/features/chat/hooks/__tests__/useAutoMarkRead.test.tsx`
- E2E `chat-auto-read.spec.ts`

## Approach

- `useAutoMarkRead({ conversationId })` se ejecuta en `<ConversationView/>`:
  - On mount: dispara mutación una vez (debounce 800ms para coalescer con WS frames iniciales).
  - On `message.created` recibido + author != self + viewport at-bottom + `document.hasFocus()`: dispara mutación debounced 800ms.
  - Cuando viewport NO está at-bottom o tab no focused: encolar la señal en `<NewMessagesPill/>` con contador acumulado.
- Mutación `useMarkConversationReadMutation` invalida `['chat','conversation',id]` y `['conversations']` (rail badge). El backend emite `message.read.batch` al propio requester (multi-tab sync) y `conversation.activity_updated` con `unread_count_delta` al rail.
- Click en `<NewMessagesPill/>` → scroll programático al fondo + dispara mark-read inmediatamente.
- `useViewportAtBottom` con tolerancia ~50px del fondo (configurable).

## Investigation targets

**Required:**

- Solution doc §4.1.3 (POST /read) y §4.2.3 (`message.read.batch`)
- Solution doc §7.5 (auto-read rules: at-bottom + focused + debounce 800ms)
- `src/features/chat/components/MessageTimeline.tsx` (F.4) — exposición del estado at-bottom
- `src/features/chat/queries.ts` (F.3) — invalidaciones consistentes

## Design context

Pill flotante con corner radius generoso, sticky-bottom-center, slight shadow. Token `--primary` para el fill. Animación slide-up al aparecer / fade out al colapsar.

## Key context

- `marked_count=0` es válido (idempotente, sin escritura). No mostrar toast ni error.
- Rate-limit del backend (B.10) está en send, no en read; pero igualmente debounce evita pings innecesarios al cambiar tabs.
- Multi-tab: si el usuario tiene la misma conversación abierta en 2 tabs, ambos reciben `message.read.batch`. La UI no muestra nada distinto al receptor en MVP, pero el flag `read_by_self` debe quedar coherente en el cache de los dos tabs.

## Acceptance

- [ ] Abrir conversación con 3 unreads → contador del rail vuelve a 0 en <2s.
- [ ] Recibir mensaje con viewport at-bottom + tab focused → auto-read disparado debounced.
- [ ] Recibir mensaje con viewport arriba → `<NewMessagesPill/>` "2 mensajes nuevos" (acumulado correcto).
- [ ] Click en pill → scroll a fondo + auto-read inmediato.
- [ ] Tab no focused → no auto-read (queda pendiente; al volver el foco se evalúa de nuevo).
- [ ] Sin loops: recibir el `message.read.batch` propio NO redispara mark-read.

## Done summary

_To be filled by the worker on completion._

## Evidence

_To be filled by the worker on completion (commands run, test output, screenshots, etc.)._
