---
satisfies: [R1, R2]
---

## Description

Crear la ruta `/_brand/payments` con guard de brand admin + onboarding y agregar item de sidebar "Payments & Spending" en `BrandShell` (con icono `Wallet`). `CreatorShell` no debe mostrar este item.

**Size:** M
**Files:**

- `src/routes/_brand/payments.tsx` (nuevo)
- `src/features/identity/components/BrandShell.tsx` (modificar)
- `src/routes/_brand.test.ts` o nuevo test del guard
- Test del item de sidebar (visibilidad brand vs creator)

## Approach

- Usar `createFileRoute('/_brand/payments')` con `validateSearch` Zod (period, campaignId, creatorId, q) para que F.3 enchufe sin re-tocar la ruta.
- Reutilizar el guard del route group `_brand` (ya verifica `account.kind=brand`); agregar verificación de rol `admin` y onboarding completo según el patrón ya usado en otras rutas brand.
- Item sidebar: seguir patrón de `SidebarItem.tsx`. Active state cuando `pathname` empieza con `/payments`.
- Render placeholder simple por ahora (la UI completa la hace .4).

## Investigation targets

**Required:**

- `src/routes/_brand.tsx` — guard del route group brand.
- `src/routes/_brand/campaigns.tsx` — patrón de ruta brand existente.
- `src/features/identity/components/BrandShell.tsx` — donde se monta el sidebar.
- `src/features/identity/components/SidebarItem.tsx` — patrón de item.
- `src/features/identity/components/CreatorShell.tsx` — confirmar que NO incluye el item.

**Optional:**

- `src/routes/_brand.test.ts` — patrón de test de guard.

## Design context

DESIGN: usar tokens shadcn/dark (no hex). Sidebar item con icono `Wallet` (lucide-react). Active state según convención existente en `SidebarItem.tsx`. UI redondeada (radios shadcn `--radius`).

## Acceptance

- [ ] Ruta `/payments` accesible solo para brand con rol `admin` y onboarding completo.
- [ ] Creator que intente navegar a `/payments` recibe el mismo fallback que otras rutas brand (consistente).
- [ ] `BrandShell` muestra item "Payments & Spending" con icono `Wallet`; active cuando ruta empieza con `/payments`.
- [ ] `CreatorShell` no muestra el item.
- [ ] `validateSearch` Zod tipa los 4 search params (period default `30d`).
- [ ] Tests cubren: guard brand vs creator, sidebar visibility, validateSearch acepta defaults.
- [ ] Item de sidebar tiene nombre accesible.

## Done summary
Ruta payments, guard admin, item sidebar y tests implementados correctamente siguiendo los patrones del proyecto
## Evidence
- Commits:
- Tests:
- PRs: