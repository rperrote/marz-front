---
satisfies: [R6]
---

## Description

`<ConversationRailEmpty/>` con 3 variantes según fuente del vacío. Texto literal del spec § edge cases. Cableado en `<ConversationRail/>` cuando la primera página viene vacía.

**Size:** S
**Files:**

- `src/features/chat/workspace/ConversationRailEmpty.tsx` (nuevo)
- Modificación: `src/features/chat/workspace/ConversationRail.tsx` para discriminar variante
- Tests co-located

## Approach

- Tres variantes (ver `02-spec.md` § edge cases):
  - `no_conversations`: filter=`all`, search vacío, lista vacía → "Las conversaciones aparecerán cuando inicies una colaboración".
  - `no_search_results`: search no vacío, lista vacía → texto del spec.
  - `no_filter_results`: filter=`unread|needs_reply` y/o `campaign_id` aplicado, lista vacía → texto del spec.
- Discriminación en `<ConversationRail/>`: leer search params actuales y elegir variante.
- Iconografía y copy del DS — fallback a un `<div>` simple con `<h3>` + `<p>` si no hay primitivo dedicado.

## Investigation targets

**Required:**

- `marz-docs/features/FEAT-003-workspace-shell/02-spec.md` § edge cases — copy exacto
- Pencil `XSdsQ` para visual del empty

## Design context

Centrado vertical en el rail (320px). Tipografía `text-muted-foreground` para subtítulo, `text-foreground` para título. Sin emojis si el spec no los pide.

## Acceptance

- [ ] Tres variantes implementadas con discriminación correcta por search params + estado de la query.
- [ ] Texto literal del `02-spec.md` § edge cases por cada variante.
- [ ] Tests Vitest: una por variante, assertion por texto.
- [ ] `pnpm typecheck` y `pnpm lint` verdes.

## Done summary
Tests de integración completos para los 4 branches de empty state en ConversationRail. Lógica de variantes correcta: search > filter/campaign > no_conversations. Eliminación de emptySlot prop y encapsulamiento en ConversationRailEmpty sin regresiones. Sin issues.
## Evidence
- Commits:
- Tests:
- PRs: