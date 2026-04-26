---
satisfies: [R2, R8]
---

## Description

Implementar `<ConversationRail/>` con paginación infinita consumiendo `useGetApiV1ConversationsInfinite`, renderizando cada conversation con `<ConversationRailItem/>` (wrap del `ChatRailItem` existente del DS).

**Size:** M
**Files:**

- `src/features/chat/workspace/ConversationRail.tsx` (nuevo)
- `src/features/chat/workspace/ConversationRailItem.tsx` (nuevo)
- `src/features/chat/workspace/useConversationsQuery.ts` (nuevo, wrapper sobre el hook generado)
- Tests co-located

## Approach

- `<ConversationRail/>` lee filtros desde `Route.useSearch()` y los pasa a `useConversationsQuery`.
- Paginación: scroll trigger del bottom (IntersectionObserver) dispara `fetchNextPage` si `hasNextPage`. `cursor` opaque base64, lo maneja Orval.
- `staleTime: 0`, `gcTime: 5min`.
- `<ConversationRailItem/>` mapea `ConversationListItem` DTO → props de `ChatRailItem` existente:
  - Avatar: si `counterpart.avatar_url == null`, fallback iniciales (primer char de `display_name`).
  - Preview: `kind === 'empty'` → "Conversación iniciada"; `'system_event'` → label tal cual viene; `'text'` → text; `'attachment'` → label "Archivo adjunto" o equivalente.
  - Timestamp relativo desde `last_activity_at`: < 1h → `Nm`, < 24h → `Nh`, < 7d → `Nd`, sino `MMM d`.
  - Indicador no-leído visible cuando `unread_count > 0`.
- Estados: loading skeleton (3-5 placeholders), error con retry, empty delegado a F.7 (montar import lazy o pasar slot).

## Investigation targets

**Required:**

- `src/features/chat/components/ChatRailItem.tsx` — primitivo a envolver
- `src/shared/api/generated/conversations/conversations.ts` (después de F.2) — hook
- `marz-docs/features/FEAT-003-workspace-shell/03-solution.md` §7.4

**Optional:**

- Otros usos de `useInfiniteQuery` en el repo si existen (grep)

## Design context

Pencil ref `XxB84` (ChatRailItem). Ya está en el DS — no rediseñar. Spacing entre items, indicador unread, avatar fallback siguen el componente. Validación visual del rail completo contra `XSdsQ` ≥ 95%.

## Acceptance

- [ ] `<ConversationRail/>` renderiza items via `useGetApiV1ConversationsInfinite`.
- [ ] Scroll al fondo dispara `fetchNextPage` (IntersectionObserver).
- [ ] Avatar fallback iniciales cuando `avatar_url == null`.
- [ ] Preview correcto por cada `kind` (text / system_event / attachment / empty).
- [ ] Timestamp relativo (`2h`, `1d`, `Apr 12`).
- [ ] Indicador unread visible cuando `unread_count > 0`.
- [ ] Tests Vitest: render con 0/1/N items; estados loading/error.
- [ ] Validación visual ≥ 95% contra Pencil `XxB84` y `XSdsQ`.
- [ ] `pnpm typecheck` y `pnpm lint` verdes.

## Done summary
Todos los cambios son correctos. El tipo genérico de customFetch refleja la shape real de handleResponse. El onClick quedó en el button semánticamente correcto. Los tests verifican el DOM observable (dot aria-hidden + getByRole button) en vez de detalles de implementación internos.
## Evidence
- Commits:
- Tests:
- PRs: