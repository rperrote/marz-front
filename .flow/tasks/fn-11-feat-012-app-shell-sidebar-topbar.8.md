---
satisfies: [R3, R8, R9]
---

## Description

Cierre del epic: cobertura de accesibilidad y verificación visual end-to-end del shell desktop para ambos kinds. Sin analytics (Q12.6).

**Size:** M
**Files:**

- Tests E2E (Playwright) en `e2e/` o equivalente del repo.
- Tests A11y (`@testing-library/jest-dom`, `axe` si está disponible) — o ampliar tests existentes.

## Approach

- E2E desktop con Playwright (autenticación mockeada o usuarios de fixture según convención del repo):
  - Brand onboarded: render `_brand` → ve sidebar con items brand, navega a `/workspace` e `/inbox`, items disabled muestran tooltip y no cambian URL.
  - Creator onboarded: render `_creator` → ve sidebar creator, navega a `/workspace` e `/inbox`, no ve items brand.
  - Mismatch: brand intenta `_creator/*` y termina en `/workspace` (verificar URL final).
  - Sin onboarding: redirige a onboarding correcto.
- A11y:
  - Todos los items del sidebar tienen accessible name.
  - Tab por sidebar muestra tooltip por focus, no solo hover.
  - Back action en topbar tiene accessible name y foco visible.
  - Sin labels visibles permanentes en sidebar.
- Verificación visual subjetiva: comparar screenshots del sidebar (72px) y topbar base contra los nodos `.pen` (`eSXMq`, `ZEwxF`, `D0icl`, `pB0OC` y variantes) en light + dark, desktop. Sin métrica numérica — revisión humana.
- Confirmar que no se emiten eventos de analytics desde el shell (grep + test).

## Investigation targets

**Required:**

- `e2e/` (estructura existente de Playwright en el repo).
- `src/shared/analytics/track.ts` — confirmar que el shell no la consume.

**Optional:**

- `marz-design/marzv2.pen` (vía MCP pencil) para comparación visual.

## Design context

- **Sidebar:** 72px ancho fijo, items 44x44, icon 22px, light + dark.
- **Topbar:** 56px alto fijo, sticky.
- **Tooltip:** "Próximamente" en disabled, label real en enabled.
- **Do's:** verificar visualmente cambios de tema sin layout shift.
- **Don'ts:** no aceptar diferencias de altura entre rutas.

Full design system: `marzv2.pen` vía MCP pencil.

## Acceptance

- [ ] E2E desktop brand: sidebar muestra items brand correctos; navegación a `/workspace` y `/inbox` funcional.
- [ ] E2E desktop creator: sidebar muestra items creator; no aparecen items brand.
- [ ] E2E desktop: click en item disabled (`Inicio`, `Campaigns`, `Creators`, `Analytics`) muestra tooltip "Próximamente" y no cambia URL.
- [ ] E2E: brand entra a `_creator/*` y termina en `/workspace`; creator entra a `_brand/*` y termina en `/workspace`.
- [ ] A11y: assert que cada item del sidebar tiene accessible name y tooltip por focus.
- [ ] A11y: back action del topbar tiene accessible name y `:focus-visible`.
- [ ] Verificación visual subjetiva contra nodos `.pen` `eSXMq`, `ZEwxF`, `D0icl`, `pB0OC`, `fT0pK`, `5v7Tq`, `dTFk2`, `SJs5q` en light + dark.
- [ ] Grep + test: shell no llama `track`/analytics.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint` y suite E2E pasan.

## Done summary
Cierre de epic A11y+E2E completo: tests unitarios de accesibilidad por teclado, grep estático de analytics, test de labels sin texto visible, ruta /inbox con beforeLoad + tests unitarios siguiendo el patrón de workspace, y suite E2E con fixtures existentes cubriendo brand/creator/mismatch/onboarding. Sin problemas bloqueantes.
## Evidence
- Commits:
- Tests:
- PRs: