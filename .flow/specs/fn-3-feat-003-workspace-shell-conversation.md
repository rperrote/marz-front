# FEAT-003 — Workspace Shell + Conversation Rail (Frontend)

## Overview

Monta el `Workspace` accesible en `/workspace` para usuarios `onboarded`. Dos rutas TanStack (`_brand/workspace` y `_creator/workspace`) con layout 2-columnas (rail 320px + outlet). El rail consume `GET /api/v1/conversations` con paginación keyset, soporta filtros (All / Unread / Needs reply), search debounced, y selector de campaign (brand-only). Reordena en vivo vía WS topic `workspace_rail` al recibir `conversation.activity_updated`. El outlet sin `conversation_id` muestra `<EmptyConversationState/>`. Solo frontend — backend (marz-api) entrega contrato vía `pnpm api:sync` cuando deploye `B.4` a dev.

Solution doc: `marz-docs/features/FEAT-003-workspace-shell/03-solution.md` (§7 frontend).

## Scope

**In**:

- Rutas `_brand/workspace.tsx` y `_creator/workspace.tsx` con `validateSearch` Zod.
- `<WorkspaceLayout/>`, `<ConversationRail/>`, `<ConversationRailItem/>`, `<ConversationFilterTabs/>`, `<CampaignFilterSelect/>` (brand only), `<ConversationRailEmpty/>`, `<EmptyConversationState/>`.
- Hook custom `useWorkspaceRailSubscription` (WS `workspace_rail` → `queryClient.setQueriesData`).
- Regenerar cliente API (`pnpm api:sync`) y consumir `useGetApiV1ConversationsInfinite` + `useGetApiV1Campaigns` (existente).
- Analytics: `workspace_opened`, `conversation_rail_search`, `conversation_filter_changed`, `conversation_campaign_filter_changed`.

**Out**:

- Detalle de conversation (selección + render de mensajes) → FEAT-004.
- Cualquier endpoint nuevo / cambios en backend → tasks B.\* del solution viven en `marz-api`, no acá.
- Tabla materializada `chat.conversation_account_state` (R-1 mitigation) — futuro.

## Approach

- Rutas live-coexisten con `_brand.tsx` / `_creator.tsx` existentes (guards de onboarding ya están).
- Componentes en `src/features/chat/workspace/` (subcarpeta nueva, hermana de `src/features/chat/components/` existente).
- `<ConversationRailItem/>` envuelve el primitivo `ChatRailItem` ya existente en `src/features/chat/components/ChatRailItem.tsx` mapeando el DTO al shape del primitivo.
- Search params son fuente de verdad de filtros; cambios via `navigate({ replace: true })` para no romper back.
- WS: extender el hub `useWebSocket` (`src/shared/ws/useWebSocket.ts`) con un mensaje de subscripción `{ type: 'subscribe', topic: 'workspace_rail' }` enviado al `open`. Hoy `enabled: false` — encender desde el provider raíz cuando F.6 cablee.
- TanStack Query: `staleTime: 0` para conversations (WS keep fresh), `60s` para campaigns. `gcTime: 5min`.
- F.1 puede arrancar con tipos mockeados a mano (snapshot del response shape definido en §4.1.1 del solution) hasta que F.2 entre. Luego los reemplaza.

## Quick commands

```bash
# Smoke local (después de F.1)
pnpm dev
# abrir http://localhost:3000/workspace como brand → ve sidebar + rail (mock) + EmptyConversationState
# abrir http://localhost:3000/workspace como creator → idem sin campaign selector

# Regenerar cliente API (después de que B.4 esté en dev)
pnpm api:sync

# Tests
pnpm test src/features/chat/workspace
pnpm typecheck
```

## Acceptance

- **R1:** `/workspace` para brand y creator monta `<WorkspaceLayout/>` (rail + outlet) con guard de onboarding ya presente. Sin sub-ruta, outlet muestra `<EmptyConversationState/>`.
- **R2:** El rail consume `GET /api/v1/conversations` paginado (`useInfiniteQuery`), scroll dispara `fetchNextPage`, render por `ChatRailItem` con avatar fallback de iniciales y timestamp relativo (`2h`, `1d`, `Apr 12`).
- **R3:** Tabs `All / Unread / Needs reply` y search debounced 200ms sincronizan a search params (`?filter=…&search=…`). Borrar search restaura lista filtrada por filtro activo.
- **R4:** `<CampaignFilterSelect/>` aparece solo en `_brand/workspace`, popula desde `useGetApiV1Campaigns({status:'active,paused'})`, default "Todas las campaigns". 409 (`validation.campaign_filter_invalid`) resetea a "Todas" + toast neutro.
- **R5:** WS event `conversation.activity_updated` reordena la lista vía `queryClient.setQueriesData` sin refetch. `conversation_id` no presente en cache → no-op (no fuerza refetch).
- **R6:** Estados vacíos del rail con tres variantes (sin conversaciones, sin resultados de search, sin resultados de filtro) con texto literal del spec §edge cases.
- **R7:** Analytics: 4 eventos disparan en sus puntos correctos (`workspace_opened` al montar, `conversation_rail_search` debounced con `{has_results}`, `conversation_filter_changed`, `conversation_campaign_filter_changed`).
- **R8:** A11y: rail `role="region" aria-label="Conversations"`, search input con `aria-label`, tabs con `role="tablist" / role="tab" / aria-selected`. Empty state con `<h2>`.
- **R9:** Tipos generados (`ConversationListItem`, `ConversationListResponse`, `useGetApiV1ConversationsInfinite`) committeados en `src/shared/api/generated/` después de `pnpm api:sync` contra spec con `B.4` deployado.

## Early proof point

Task `fn-3-feat-003-workspace-shell-conversation.1` (Setup rutas + WorkspaceLayout) valida que el guard de onboarding existente compone con las nuevas rutas y que el shell renderiza correctamente para ambos kinds. Si falla, replantear si conviene una sola ruta `/workspace` con detect-by-kind interno en lugar de dos pathless groups.

## Requirement coverage

| Req | Description                                                                        | Task(s)                                                                                                                                  | Gap justification |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| R1  | Rutas `/workspace` brand + creator con WorkspaceLayout y EmptyConversationState    | fn-3-feat-003-workspace-shell-conversation.1                                                                                             | —                 |
| R2  | Rail con paginación infinita + ChatRailItem + avatar fallback + timestamp relativo | fn-3-feat-003-workspace-shell-conversation.3                                                                                             | —                 |
| R3  | Filter tabs + search debounced sincronizando search params                         | fn-3-feat-003-workspace-shell-conversation.4                                                                                             | —                 |
| R4  | Campaign filter brand-only con manejo de 409                                       | fn-3-feat-003-workspace-shell-conversation.5                                                                                             | —                 |
| R5  | WS subscription reordena via setQueriesData sin refetch                            | fn-3-feat-003-workspace-shell-conversation.6                                                                                             | —                 |
| R6  | Tres variantes de estado vacío con copy del spec                                   | fn-3-feat-003-workspace-shell-conversation.7                                                                                             | —                 |
| R7  | 4 eventos de analytics en sus puntos correctos                                     | fn-3-feat-003-workspace-shell-conversation.8                                                                                             | —                 |
| R8  | A11y en rail, search, tabs, empty state                                            | fn-3-feat-003-workspace-shell-conversation.1, fn-3-feat-003-workspace-shell-conversation.3, fn-3-feat-003-workspace-shell-conversation.4 | —                 |
| R9  | `pnpm api:sync` regenera tipos + hooks de conversations                            | fn-3-feat-003-workspace-shell-conversation.2                                                                                             | —                 |

## References

- Solution: `marz-docs/features/FEAT-003-workspace-shell/03-solution.md`
- Spec: `marz-docs/features/FEAT-003-workspace-shell/02-spec.md`
- Pencil designs: `XSdsQ` (brand workspace), `2xWvk` (creator workspace), `XxB84` (ChatRailItem)
- Existing primitives: `src/features/chat/components/ChatRailItem.tsx`, `src/shared/ws/useWebSocket.ts`
- Frontend conventions: `marz-front/CLAUDE.md`
