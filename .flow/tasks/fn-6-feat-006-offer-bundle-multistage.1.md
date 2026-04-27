---
satisfies: [R10]
---

## Description

Regenerar el cliente API tras backend mergea OpenAPI extendido (B.5) en dev. Validar que los tipos polimórficos (`CreateOfferRequest` oneOf, `OfferDTO` con `stages[]`, `OfferSnapshot` discriminado, `StageOpenedSnap`) compilan en TS estricto. Migrar call sites de `useCreateSingleOffer` al nuevo `useCreateOffer`, manteniendo `useCreateSingleOffer` como re-export deprecated por un release.

**Size:** S
**Files:**

- `src/shared/api/generated/**/*` (regenerados — committeados)
- `openapi/spec.json` (snapshot pinned)
- `src/features/offers/**/*` (call sites: actualizar nombre del hook si compila distinto)
- `orval.config.ts` (verificar override del `operationName: createOffer` si hace falta)

## Approach

1. `pnpm api:sync` apunta a backend dev. Si dev no expone aún el OpenAPI extendido, parar y coordinar con backend (B.5).
2. Verificar el diff de `src/shared/api/generated/`: solo debe agregar/extender lo listado en solution §4.3-4.4.
3. Si Orval emite `useCreateOffer` directamente (operationId del OpenAPI ya es `createOffer`), agregar `useCreateSingleOffer` como re-export en un barrel local de `src/features/offers/hooks/` para no romper FEAT-005 callers.
4. Correr `pnpm typecheck` + `pnpm test src/shared/api`.

## Investigation targets

**Required:**

- `orval.config.ts` — verificar inputs/outputs y overrides
- `src/shared/api/mutator.ts` — confirmar que el mutator pasa el body sin tocar el discriminator
- `src/features/offers/components/SendOfferSidesheet.tsx` — call site actual de `useCreateSingleOffer`
- `package.json` scripts `api:sync` / `api:generate`

**Optional:**

- `marz-front/CLAUDE.md §Cliente API` — convención del repo

## Key context

- `noUncheckedIndexedAccess` activo en TS — al consumir uniones discriminadas, narrow con `if (snapshot.type === 'bundle')` antes de tocar `deliverables`.
- Los generados son `linguist-generated=true` (`.gitattributes`), GitHub colapsa el diff.

## Acceptance

- [ ] `pnpm api:sync` corre limpio contra backend dev.
- [ ] `src/shared/api/generated/` actualizado y committeado; diff solo extiende sin breaking changes en types existentes.
- [ ] `pnpm typecheck` pasa.
- [ ] `pnpm test src/shared/api` pasa.
- [ ] `useCreateSingleOffer` sigue importable (re-export o alias) durante 1 release; `useCreateOffer` exportado y usado en `SendOfferSidesheet`.
- [ ] `openapi/spec.json` snapshot actualizado y committeado.

## Done summary

`pnpm api:sync` corrió limpio contra backend dev el 2026-04-27. Se regeneraron los endpoints existentes (accounts, campaigns, onboarding, system, test, webhooks) y se actualizó `openapi/spec.json` con el snapshot actual. No se detectaron breaking changes en types existentes.

**Bloqueado por B.5:** El spec descargado de `localhost:8080` aún no contiene endpoints ni schemas de offers (`CreateOfferRequest`, `OfferDTO`, `OfferSnapshot`, `StageOpenedSnap`). Sin el contrato extendido no es posible:

1. Generar los tipos polimórficos en `src/shared/api/generated/`.
2. Migrar `useCreateSingleOffer` → `useCreateOffer`.
3. Validar que las uniones discriminadas compilen en TS estricto.

`useCreateSingleOffer` se mantiene como hook manual con RAFITA:BLOCKER documentado. No se rompieron call sites de FEAT-005.

Task marcada como **blocked** en flowctl hasta que backend mergee B.5.

## Evidence

```
$ pnpm typecheck
> marz-front@ typecheck
> tsc --noEmit
(pasa limpio)

$ pnpm test src/shared/api
> vitest run src/shared/api
 RUN  v3.2.4
 ✓ src/shared/api/mutator.test.ts (11 tests) 7ms
 Test Files  1 passed (1)
      Tests  11 passed (11)
   Duration  795ms
```
