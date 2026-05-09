---
satisfies: [R1]
---

## Description

Regenerar el cliente Orval contra el backend dev de FEAT-016 y dejar accesible la ruta `/earnings` solo para creator users dentro del `CreatorShell`. Es la base estructural del épico: si no anda, el resto se bloquea.

**Size:** M
**Files:**

- `src/routes/_creator/earnings.tsx` (nuevo)
- `src/features/identity/components/CreatorShell.tsx` (modificar — agregar item Earnings con icon `DollarSign`)
- `src/shared/api/generated/*` (regenerado, gitignored)
- `src/features/earnings/index.ts` (placeholder export)

## Approach

- Correr `pnpm api:sync` apuntando al backend dev. Verificar que `CreatorEarningsResponse`, `OfferBonusTerms` y schemas relacionados se regeneren.
- Crear ruta pathless dentro del grupo `_creator.tsx` siguiendo el patrón existente de otras rutas creator (ver hermanas en `src/routes/_creator/*`).
- En `CreatorShell` insertar item `Earnings` con icon `DollarSign` de `lucide-react`; mantener el orden Inbox / Messages / Offers / Earnings / Campaign board del diseño.
- El componente de página puede ser un stub mínimo ("Earnings" + skeleton); el contenido real llega en .3+.

## Investigation targets

**Required**:

- `src/routes/_creator.tsx` y rutas hermanas — patrón de pathless route group + guard.
- `src/features/identity/components/CreatorShell.tsx` — sidebar items y active state.
- `package.json` script `api:sync` — flujo Orval.
- `marz-docs/features/FEAT-016-creator-earnings/03-solution.md` §4.4, §7.1 — tipos esperados y rutas.

**Optional**:

- `src/routes/_brand.tsx` — referencia comparativa de guard por `account.kind`.

## Design context

Sidebar creator es icon-only/collapsed (ver frame `m63kj`). Tokens dark de `marzv2.pen` mapeados a shadcn naming. Active state usa `--primary` con radio generoso. Icon `DollarSign` de lucide.

## Acceptance

- [ ] `pnpm api:sync` corre sin errores y genera `CreatorEarningsResponse`, `OfferBonusTerms`, `OfferSpeedBonusWindow` en `src/shared/api/generated/`.
- [ ] Creator autenticado navega a `/earnings` y ve la shell (vacía o skeleton) sin errores.
- [ ] Brand user que intenta entrar es redirigido por el guard de `_creator.tsx`.
- [ ] Sidebar `CreatorShell` muestra item `Earnings` con icon `DollarSign` y marca activo en la ruta.
- [ ] `pnpm typecheck` pasa.

## Done summary
Ambos fixes aplicados correctamente: earnings.tsx queda como stub limpio sin schema anticipado, y Messages pasa a to: undefined eliminando el doble active state.
## Evidence
- Commits:
- Tests:
- PRs: