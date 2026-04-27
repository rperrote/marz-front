---
satisfies: [R3, R8]
---

## Description

Search input + filter tabs (`All / Unread / Needs reply`) en el header del rail. Sincronizan a search params de la ruta con `navigate({ replace: true })`.

**Size:** M
**Files:**

- `src/features/chat/workspace/ConversationFilterTabs.tsx` (nuevo)
- `src/features/chat/workspace/ConversationSearchInput.tsx` (nuevo)
- Modificación: `src/features/chat/workspace/ConversationRail.tsx` (montar header)
- Tests co-located

## Approach

- Search input: debounce 200ms (helper local o `use-debounce` si ya está en deps; chequear primero). Trim + max 80 chars. Cambio dispara `navigate({ search: prev => ({...prev, search: value || undefined}), replace: true })`.
- Tabs: `<button role="tab" aria-selected>` x3. Cambio dispara navigate con `replace: true`.
- Borrar search restaura lista por filtro activo (omitir `search` del search params, no enviar string vacío).
- A11y: input con `aria-label="Search conversations"`. Tablist con `role="tablist"`, cada tab `role="tab" aria-selected={true|false}`.

## Investigation targets

**Required:**

- TanStack Router docs sobre `validateSearch` + `navigate` con search updater (ya en uso en otras rutas)
- `marz-docs/features/FEAT-003-workspace-shell/03-solution.md` §7.7 F.4
- `package.json` para confirmar si hay `use-debounce` o equivalente

**Optional:**

- Patrones de search params en `src/routes/_brand/campaigns.tsx`

## Design context

Header del rail (search bar + tabs) sigue Pencil `XSdsQ`. Tokens: `bg-background`, `text-muted-foreground` para placeholder. Tab activo con `bg-primary/10` o el token equivalente del DS.

## Acceptance

- [ ] Tabs `All / Unread / Needs reply` cableados a `?filter=…` con `replace: true`.
- [ ] Search debounced 200ms, escribe a `?search=…` con `replace: true`.
- [ ] Search vacío omite el param (no `?search=`).
- [ ] Tabs con `role="tablist"`, `role="tab"`, `aria-selected`.
- [ ] Input con `aria-label`.
- [ ] Tests Vitest: typing dispara debounce; tab change navega; borrar restaura.
- [ ] E2E (si Playwright disponible): smoke del flujo search + filter.
- [ ] `pnpm typecheck` y `pnpm lint` verdes.

## Done summary

isFirstRender ref resuelve el navigate espurio en mount. FilterValue derivado de BrandWorkspaceSearch elimina duplicación del union. Tests sincronizados. Sin issues.

## Evidence

- Commits:
- Tests:
- PRs:
