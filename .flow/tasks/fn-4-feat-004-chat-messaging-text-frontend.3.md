---
satisfies: [R1, R9, R10]
---

## Description

Crear las dos rutas anidadas (`_brand/workspace/conversations/$conversationId.tsx` y `_creator/workspace/conversations/$conversationId.tsx`) y el shell `<ConversationView/>` con `<ConversationHeader/>` (avatar + nombre + handle + slot para presence badge), un placeholder de timeline y un slot de composer. El loader prefetchea `useConversationDetailQuery` y la primera página de `useMessagesInfiniteQuery`. 404/403 caen en `<EmptyConversationFallback/>`.

**Size:** M
**Files:**

- `src/routes/_brand/workspace/conversations.$conversationId.tsx`
- `src/routes/_creator/workspace/conversations.$conversationId.tsx`
- `src/features/chat/components/ConversationView.tsx`
- `src/features/chat/components/ConversationHeader.tsx`
- `src/features/chat/components/EmptyConversationFallback.tsx`
- `src/features/chat/queries.ts` — wrappers `useConversationDetailQuery`, `useMessagesInfiniteQuery` con queryKeys consistentes
- `src/features/chat/components/__tests__/ConversationHeader.test.tsx`
- `src/routes/_brand/workspace/__tests__/conversation-route.spec.ts` (E2E `chat-open-conversation`)

## Approach

- Rutas se montan bajo los pathless route groups existentes (`_brand.tsx` / `_creator.tsx`), heredan los guards de `kind` y el `WorkspaceLayout` de FEAT-003.
- Loader del route llama `queryClient.ensureQueryData` para detalle + primera página de mensajes (mismo patrón que FEAT-003).
- `<ConversationView/>` recibe `conversationId` desde `useParams`, usa los wrappers de queries y compone header + timeline placeholder + composer placeholder.
- `<ConversationHeader/>` consume `useConversationDetailQuery` y renderiza avatar + display_name + handle. Slot vacío para `<PresenceBadge/>` (lo cablea F.7).
- 404/403 del detalle → `<EmptyConversationFallback/>` con mensaje "conversación no disponible".
- Validación visual contra frames `moaXA` (brand) y `mRJ63` (creator) del `marzv2.pen`. Tokens del `.pen` ya están en `src/styles.css`.
- A11y: header con `aria-label="Conversation with {display_name}"`.

## Investigation targets

**Required:**

- `src/routes/_brand/workspace/index.tsx` y `src/routes/_creator/workspace/index.tsx` — patrón del workspace layout (FEAT-003)
- `src/features/identity/components/{BrandShell,CreatorShell}.tsx` — guards y composición
- `src/features/chat/components/ChatRailItem.tsx` (FEAT-003) — convenciones del feature `chat/`
- Solution doc §4.1.4 (`GET /conversations/{id}`) y §7.1–§7.2

**Optional:**

- `marz-front/CLAUDE.md` §Path aliases y §Convenciones de código

## Design context

Frames del `marzv2.pen`:

- Brand: `moaXA` (chat shell), `FJAJJ` (variantes)
- Creator: `mRJ63`, `FthFP`
- Componentes existentes: `xYQWa` (ChatHeaderActions)

UI redondeada (corner radii del token system, nunca cuadrada). Light + Dark from day 1. Render a través de utilities Tailwind v4 que mapean los tokens (`bg-background`, `text-foreground`, `rounded-lg`); nunca hardcodear color/radio/spacing.

## Key context

- `ConversationCounterpart` (FEAT-003) no se modifica; `is_active` y `presence` viven en `ConversationDetail` (este endpoint).
- `can_send=false` cuando `counterpart.is_active=false` — el composer (F.5) lo lee; este task expone el flag por la query.

## Acceptance

- [ ] Navegar a `/workspace/conversations/{id}` (brand y creator) renderiza header con datos reales del backend.
- [ ] Loader prefetchea detalle + primera página de mensajes; sin waterfall en network al primer paint.
- [ ] 404/403 del detalle → `<EmptyConversationFallback/>`.
- [ ] E2E `chat-open-conversation`: click en `<ChatRailItem/>` → URL cambia → header muestra `display_name` correcto.
- [ ] Validación visual ≥95% del header contra frames `moaXA`/`mRJ63`.
- [ ] `aria-label="Conversation with {display_name}"` presente en el header.
- [ ] `pnpm typecheck` + `pnpm lint` verdes.

## Done summary

Inlining de BrandWorkspacePage/CreatorWorkspacePage en workspace.tsx correcta y sin regresión. Eliminación de dead code limpia. ConversationView.tsx colapsado correctamente. Estructura de subrutas /workspace/ e /workspace/conversations/$conversationId consistente con el layout-con-Outlet. routeTree.gen.ts auto-generado y coherente.

## Evidence

- Commits:
- Tests:
- PRs:
