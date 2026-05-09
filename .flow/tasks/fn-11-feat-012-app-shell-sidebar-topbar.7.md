---
satisfies: [R7, R11]
---

## Description

Adaptar las rutas existentes (Campaigns brand, Offers creator, Brief Builder, Workspace Chats si aplica) para declarar su contenido contextual del topbar mediante `useRouteTopbar`. Eliminar todo header/topbar duplicado dentro de pantallas que ya está cubierto por el shell.

**Size:** M
**Files:**

- `src/routes/_brand/campaigns.*.tsx` (modificar — declarar topbar contextual)
- `src/routes/_creator/offers.tsx` (modificar)
- `src/routes/_brand/briefs.*.tsx` o equivalente brief-builder (si existe — modificar)
- Componentes de pantalla que renderizaban header propio (eliminar duplicados).
- Tests por ruta.

## Approach

- En cada ruta listada, llamar `useRouteTopbar({ title, back?, actions?, progress? })` con la config relevante. Cleanup automático del hook (F.3) garantiza reset al desmontar.
- Para back: usar `to: '/parent'` cuando sea navegación de jerarquía clara; `onBack: () => router.history.back()` cuando sea retorno contextual.
- Eliminar headers/`<header>` propios de pantallas que solo replicaban chrome.
- Si una ruta no necesita topbar contextual, no llamar el hook → topbar muestra variante base.

## Investigation targets

**Required:**

- `src/routes/_brand/campaigns.*` — listado de rutas y headers actuales.
- `src/routes/_creator/offers.tsx` — header actual.
- `src/routes/_brand/briefs.*` o equivalente — brief builder.
- `src/features/identity/app-shell/useRouteTopbar.ts` (de F.3).

**Optional:**

- `src/routes/workspace.*` — verificar si necesita topbar contextual o queda en base.

## Key context

- `useRouteTopbar` debe llamarse a nivel de componente de ruta, no en hijos profundos, para que el cleanup matche el lifecycle de la ruta.
- No emitir analytics desde el topbar contextual.

## Acceptance

- [ ] Unit test (por ruta clave): la ruta declara `title` esperado en el topbar (verificar via render con `TopbarProvider` mock).
- [ ] Unit test: navegar de ruta con config a ruta sin config resetea topbar a variante base.
- [ ] Grep o test estático: ningún componente bajo `src/routes/_brand/`, `src/routes/_creator/` o pantallas de workspace renderiza un `<header>` con sidebar/back/title duplicado del shell.
- [ ] E2E o snapshot: navegación Campaigns → Chats → Offers no deja `title` stale del topbar.
- [ ] Topbar mantiene altura 56px en todas las rutas migradas.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` pasan.

## Done summary
Migración de topbar contextual correcta: hooks bien colocados en nivel de ruta, WizardShell suprime topbar/progress internos con null explícito, cn resuelve h-screen/h-full vía tailwind-merge, tests de integración cubren los acceptance criteria, typecheck/lint/tests pasan.
## Evidence
- Commits:
- Tests:
- PRs: