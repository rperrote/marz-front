---
satisfies: [R5, R8, R9]
---

## Description

Implementar `AppTopbar` único de **56px** con slots configurables (back, title, progress, actions) y el sistema de contexto + hook `useRouteTopbar` para que rutas hijas declaren su contenido sin crear topbars paralelos.

**Size:** M
**Files:**

- `src/features/identity/app-shell/AppTopbar.tsx` (nuevo)
- `src/features/identity/app-shell/TopbarContext.tsx` (nuevo)
- `src/features/identity/app-shell/useRouteTopbar.ts` (nuevo)
- `src/features/identity/app-shell/AppTopbar.test.tsx` (nuevo)
- `src/features/identity/app-shell/useRouteTopbar.test.tsx` (nuevo)

## Approach

- Tipo `TopbarConfig { back?: { label: string; onBack: () => void } | { to: string }; title?: ReactNode; progress?: ReactNode; actions?: ReactNode }`.
- `TopbarProvider` mantiene `config | null` en state. Expone `setTopbar(cfg)` y `resetTopbar()`.
- `useTopbar()` lee el provider; throw si está fuera del provider.
- `useRouteTopbar(config)` hook ergonómico: en `useEffect` llama `setTopbar(config)` y devuelve cleanup que llama `resetTopbar()`. Dependencias estables (memoizar config en consumidores o aceptar config "last write wins").
- `AppTopbar` lee config del context:
  - Variante base: muestra "Marz" (logo/wordmark) a la izquierda, sin slots → no reserva contenido roto.
  - Variante contextual: muestra back (si presente) → title → progress (centro/right) → actions (right). Altura constante 56px independientemente de slots.
- Mapping visual:
  - base: `pB0OC`.
  - variantes: `fT0pK`, `5v7Tq`, `dTFk2`, `SJs5q` (todas son combinaciones de slots, no topbars distintos).
- Back action: si `to` provisto, render como `<Link>`; si `onBack`, render `<button>`. Accesible name en ambos casos. Foco visible.

## Investigation targets

**Required:**

- `src/styles.css` — tokens `border`, `background`.
- `src/components/ui/button.tsx` (si existe) — variante ghost para back/actions.

**Optional:**

- React docs: patrón de provider + cleanup hook (no es novedad).

## Design context

- **Topbar:** 56px alto, sticky top, borde inferior 1px.
- **Slot izquierda:** wordmark Marz por defecto; o back action contextual.
- **Slot título:** texto truncable con ellipsis.
- **Slot derecho:** acciones (botones, avatares); progress puede ir centrado.
- **Do's:** mantener altura fija; los slots vacíos no agregan layout.
- **Don'ts:** no cambiar altura por ruta; no scroll horizontal.

Full design system: `marzv2.pen` — nodos `pB0OC`, `fT0pK`, `5v7Tq`, `dTFk2`, `SJs5q`.

## Key context

- React 19: `useEffect` con cleanup sigue siendo el patrón correcto para registrar/desregistrar config.
- "Last write wins" — si dos rutas se monten al mismo tiempo (no debería en TanStack Router), la última gana. Cleanup garantiza que al salir de la ruta el topbar vuelve a base.

## Acceptance

- [ ] Unit test: variante base muestra wordmark Marz, sin back/title/progress/actions.
- [ ] Unit test: con `setTopbar({ back, title })`, topbar muestra back + title sin cambiar altura.
- [ ] Unit test: `useRouteTopbar({...})` registra config en mount y limpia en unmount (verificar con render/unmount).
- [ ] Unit test: navegar entre dos componentes que usan `useRouteTopbar` con configs distintas resetea entre ellos.
- [ ] Unit test: `useTopbar` fuera de `TopbarProvider` lanza error claro.
- [ ] A11y: back action tiene accessible name; foco visible (`:focus-visible`).
- [ ] Topbar mide 56px de alto en todas las variantes (assert).
- [ ] Verificación visual subjetiva contra `pB0OC` y combinaciones `fT0pK`, `5v7Tq`, `dTFk2`, `SJs5q`.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` pasan.

## Done summary
AppTopbar, TopbarContext y useRouteTopbar implementados correctamente — context/hook pattern limpio, tipos completos, a11y correcta, tests cubren todos los acceptance criteria, typecheck + lint + tests verdes
## Evidence
- Commits:
- Tests:
- PRs: