---
satisfies: [R2, R9, R10]
---

## Description

Implementar `<MessageTimeline/>` virtualizada con paginación infinita hacia atrás, scroll anchoring que conserva la posición visual al cargar páginas anteriores, day separators en hora local, y `<MessageBubble/>` (variantes `in`/`out` para `type='text'`). Marca "inicio de la conversación" cuando `next_before_cursor=null`.

**Size:** M
**Files:**

- `src/features/chat/components/MessageTimeline.tsx`
- `src/features/chat/components/MessageBubble.tsx`
- `src/features/chat/components/DaySeparator.tsx`
- `src/features/chat/utils/groupByDay.ts`
- `src/features/chat/utils/__tests__/groupByDay.test.ts`
- `src/features/chat/components/__tests__/MessageTimeline.test.tsx`
- E2E `chat-history-scroll.spec.ts`

## Approach

- Decidir entre TanStack Virtual y `react-virtuoso` con un benchmark cualitativo corto (2 escenarios: 100 msgs, 5k msgs). Documentar la decisión en el código.
- Scroll anchoring: al disparar `fetchPreviousPage` capturar `scrollHeight` antes y compensar después para conservar posición visual ±10px.
- Trigger de `fetchPreviousPage`: IntersectionObserver sobre un sentinel arriba de la lista; deshabilitado cuando `hasNextPage=false` (`next_before_cursor=null`).
- Cuando no hay más historial, renderizar pill "Inicio de la conversación".
- Agrupar mensajes por día en hora local (Intl o el formatter ya usado en el repo). "Hoy"/"Ayer" especiales; resto `DD MMM`. Lógica pura testeable.
- `<MessageBubble/>` variantes:
  - `out` (autor == requester): alineado a la derecha, color brand fill, tick "enviando/enviado/falló" del status TanStack Query.
  - `in` (autor != requester): alineado a la izquierda, surface neutral.
  - Render `text_content` como texto plano (`{text}` JSX, NUNCA `dangerouslySetInnerHTML`).
- `aria-label` por bubble: `"{author_display_name} a las {hora local}: {preview}"`.

## Investigation targets

**Required:**

- Solution doc §4.1.2 (shape de `MessageListResponse`) y §7.2 (componentes)
- Solution doc §4.2.2 (`message.created`) — para entender el contrato; el cableo del listener vive en F.5
- `src/features/chat/queries.ts` (creado en F.3) — para usar `useMessagesInfiniteQuery` con `getNextPageParam`

**Optional:**

- Repos similares en `src/features/*/components/` con paginación para ver convenciones existentes

## Design context

Frames `marzv2.pen`:

- Bubble in/out: referencia conceptual `xC7no`/`FdjGh` (mobile en .pen, equivalentes desktop en `Brand 03`)
- Day separator: pill con corner radius generoso

UI redondeada siempre; bubbles con corner radius asimétrico estilo chat (esquina inferior interna más cerrada). Light + Dark coherentes.

## Key context

- Render como texto plano: confirmar con un test que inyecta `<script>alert(1)</script>` como `text_content` y verifica que se muestra literal en el DOM.
- Ordenar al renderizar: el endpoint devuelve DESC por `(created_at, id)`; el cliente invierte a ASC para mostrar.
- `read_by_self` viene del server pero no afecta UI en MVP (no hay tick "seen"); mantener el flag por coherencia con eventos `message.read.batch` futuros.

## Acceptance

- [ ] Render correcto de N páginas con virtualización; sin saltos visuales al hacer scroll-up.
- [ ] `fetchPreviousPage` se dispara al llegar al sentinel y conserva posición visual ±10px (E2E `chat-history-scroll`).
- [ ] Marca "inicio de la conversación" cuando `next_before_cursor=null`.
- [ ] Day separators today/yesterday/`DD MMM` en hora local del usuario; unit test cubre los 3 casos + cambio de día.
- [ ] Test XSS: inyectar `<script>` en `text_content` se muestra literal.
- [ ] Validación visual ≥95% de bubble in/out contra frames del `.pen`.
- [ ] A11y: cada bubble con `aria-label` informativo.

## Done summary
Todos los cambios son correctos. groupByDay usa hora local via toLocaleDateString('sv'), timezone-safe. Tests ajustados a 12:00Z garantizan separación de días independiente del offset local. MessageTimeline resuelve display name desde conversationDetail con fallback vacío durante loading. Mocks del test discriminan por URL correctamente. E2E usa ruta correcta y assertions basadas en condiciones observables en vez de timeouts fijos.
## Evidence
- Commits:
- Tests:
- PRs: