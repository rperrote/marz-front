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

Diff de una línea: comentario RAFITA:BLOCKER expandido con nombres de tipos ausentes y fecha del intento — cambio correcto y mínimo dado el blocker real de B.5

## Evidence

- Commits:
- Tests:
- PRs:
