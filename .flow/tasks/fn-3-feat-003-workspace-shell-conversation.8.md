---
satisfies: [R7]
---

## Description

Instrumentar los 4 eventos de analytics del spec § Analítica usando el helper `track()` existente (FEAT-002).

**Size:** S
**Files:**

- Modificación: `src/routes/_brand/workspace.tsx`, `src/routes/_creator/workspace.tsx` (workspace_opened)
- Modificación: `src/features/chat/workspace/ConversationSearchInput.tsx` (conversation_rail_search)
- Modificación: `src/features/chat/workspace/ConversationFilterTabs.tsx` (conversation_filter_changed)
- Modificación: `src/features/chat/workspace/CampaignFilterSelect.tsx` (conversation_campaign_filter_changed)
- Tests co-located

## Approach

- `workspace_opened`: en `useEffect(() => { track('workspace_opened', { account_kind }) }, [])` al montar la ruta. Disparar **una vez** por mount; usar el `account.kind` del session helper existente.
- `conversation_rail_search`: en el callback debounced (mismo timer que el navigate). Payload `{ has_results: boolean }` — derivar de la query data tras settle. Si la query aún no resolvió, emitir cuando `isSuccess` cambie a `true` para esa búsqueda.
- `conversation_filter_changed`: al cambiar tab, antes/después de navigate. Payload `{ filter }`.
- `conversation_campaign_filter_changed`: al cambiar select. Payload `{ has_campaign_selected: boolean }`.
- `conversation_selected_from_rail` NO se implementa acá (FEAT-004).

## Investigation targets

**Required:**

- Helper `track` (grep `track(` o `analytics`) — del FEAT-002
- Session/account helper para `account_kind`
- `marz-docs/features/FEAT-003-workspace-shell/02-spec.md` § Analítica
- `marz-docs/features/FEAT-003-workspace-shell/03-solution.md` §7.7 F.8

## Acceptance

- [ ] `workspace_opened` dispara una vez al montar `_brand/workspace` y `_creator/workspace` con `{account_kind}`.
- [ ] `conversation_rail_search` dispara debounced con `{has_results}`.
- [ ] `conversation_filter_changed` dispara al cambiar tab con `{filter}`.
- [ ] `conversation_campaign_filter_changed` dispara al cambiar select con `{has_campaign_selected}`.
- [ ] Tests Vitest con spy en `track`: 4 assertions, una por evento.
- [ ] `pnpm typecheck` y `pnpm lint` verdes.

## Done summary

_To be filled by the worker on completion._

## Evidence

_To be filled by the worker on completion (commands run, test output, screenshots, etc.)._
