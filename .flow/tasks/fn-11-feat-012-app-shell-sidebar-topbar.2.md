---
satisfies: [R3, R4, R8, R9]
---

## Description

Implementar el `AppSidebar` icon-only de **72px** con sus items 44x44, estados (default/active/disabled) y tooltip "Próximamente" accesible. Consume la config de F.1 vía prop `accountKind`.

**Size:** M
**Files:**

- `src/features/identity/app-shell/AppSidebar.tsx` (nuevo)
- `src/features/identity/app-shell/AppSidebarItem.tsx` (nuevo)
- `src/features/identity/app-shell/AppSidebar.test.tsx` (nuevo)

## Approach

- `AppSidebar` recibe `accountKind: 'brand' | 'creator'` y `pathname: string`. Resuelve config + active vía `resolveActiveSidebarItem` (F.1).
- Cada item se renderiza con `AppSidebarItem`:
  - Habilitado → `Link` (TanStack Router) con `aria-label={label}`, `aria-current="page"` si active.
  - Disabled → `<button type="button" aria-disabled="true">` o equivalente que NO navegue. `onClick` no-op.
  - Tooltip (shadcn `Tooltip` o equivalente del repo) con label real para enabled y "Próximamente" para disabled. Visible en hover **y** focus.
  - Sin label visible permanente.
- Ancho contenedor 72px (`w-18` o `w-[72px]`), items 44x44 centrados, icon 22px.
- Mapping visual:
  - default: nodo `eSXMq` — fondo transparente, color muted.
  - active: nodo `ZEwxF` — fondo `sidebar-accent`, color primary.
  - tooltip: nodo `D0icl` — texto 12px, borde/sombra, dentro de viewport.

## Investigation targets

**Required:**

- `src/features/identity/app-shell/navigation.ts` (de F.1)
- `src/features/identity/components/SidebarTooltip.tsx` — comportamiento legacy a igualar/superar.
- `src/components/ui/tooltip.tsx` (si existe — confirmar shadcn Tooltip disponible).
- `src/styles.css` — tokens `sidebar-accent`, `muted`, `primary`.

**Optional:**

- `src/features/identity/components/SidebarItem.tsx` — patrón legacy.

## Design context

- **Sidebar:** rail icon-only 72px, items 44x44, icon 22px, fondo `bg-background`, borde derecho sutil.
- **Estados:** default fondo transparente + foreground muted; active fondo accent + foreground primary; disabled opacity reducida + cursor not-allowed.
- **Tooltip:** aparece a la derecha del item, 12px text, padding compacto, border + shadow.
- **Do's:** import iconos por nombre (`import { MessageSquare } from 'lucide-react'`).
- **Don'ts:** no labels visibles, no badges, no contadores (out-of-scope MVP).

Full design system: `marzv2.pen` vía MCP pencil — nodos `eSXMq`, `ZEwxF`, `D0icl`.

## Key context

- A11y: items deben tener accessible name aunque label no sea visible. Usar `aria-label` o equivalente.
- Sidebar disabled como `<button>` (no `<a>`) garantiza no-navegación incluso con teclado.

## Acceptance

- [ ] Unit test: item habilitado renderiza link con accessible name = label.
- [ ] Unit test: item disabled renderiza button con `aria-disabled="true"`, sin href, no navega al click.
- [ ] Unit test: active se aplica al item resuelto por `resolveActiveSidebarItem` y solo a uno.
- [ ] Unit test: tooltip visible en hover y focus (assert via `userEvent.tab()`).
- [ ] Unit test: tooltip de item disabled muestra "Próximamente"; de habilitado muestra el label.
- [ ] Sidebar mide 72px de ancho (assert via styles aplicados o data attribute).
- [ ] Verificación visual subjetiva contra nodos `.pen` `eSXMq`, `ZEwxF`, `D0icl` en light + dark.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` pasan.

## Done summary
aria-disabled corregido: deriva solo del prop disabled, no de la condición de routing
## Evidence
- Commits:
- Tests:
- PRs: