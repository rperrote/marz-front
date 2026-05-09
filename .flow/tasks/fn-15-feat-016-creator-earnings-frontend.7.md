---
satisfies: [R7]
---

## Description

Migrar el editor de Send Offer al nuevo contrato `bonus_terms.speed_bonus_windows`. Eliminar el legacy `speed_bonus`. `multistage` no expone bonos a nivel Offer. Performance milestones quedan fuera (FEAT-020).

**Size:** M
**Files:**

- `src/features/offers/components/*Editor*` (modificar — formularios single/bundle/multistage)
- `src/features/offers/schemas/*` (modificar — Zod alineado a `OfferBonusTerms`)
- `src/features/offers/types/*` (modificar)
- Tests existentes/nuevos en `src/features/offers/**/__tests__/*`

## Approach

- Reemplazar inputs `speed_bonus` por una lista repeatable de `speed_bonus_windows`: `{ window_hours: integer >= 1, bonus_pct: decimal string > 0 }`.
- Validar:
  - `window_hours` int >=1.
  - `bonus_pct` decimal string >0 (Zod refine con regex/parse a Decimal).
  - Ordenar por `window_hours ASC` antes de submit (consistencia con backend).
- En `multistage`, NO renderizar UI de bonos a nivel Offer; el form envía `bonus_terms: null` o lo omite.
- Eliminar todo código y UI ligado a `speed_bonus` legacy (no hay datos viejos en producción).
- Tipos: usar los regenerados por `pnpm api:sync` (`OfferBonusTerms`, `OfferSpeedBonusWindow`, `CreateSingleOfferRequest`, `CreateBundleOfferRequest`, `CreateMultiStageOfferRequest`).
- NO renderizar `performance_milestones` ni inputs relacionados (van en FEAT-020).

## Investigation targets

**Required**:

- `src/features/offers/components/*` — editores existentes.
- `src/features/offers/schemas/*` — schemas Zod actuales.
- `marz-docs/features/FEAT-016-creator-earnings/03-solution.md` §3.1 (shape), §4.1 (`POST /v1/offers`), §7.4 task F.7.
- `src/shared/api/generated/*` — tipos regenerados por .1.

**Optional**:

- Patrones de field array (ej. `useFieldArray` de TanStack Form si se usa).

## Acceptance

- [ ] Forms `single` y `bundle` permiten crear/editar N speed_bonus_windows con validación de `window_hours` (int>=1) y `bonus_pct` (decimal string >0).
- [ ] Form `multistage` no muestra UI de bonos a nivel Offer.
- [ ] No queda referencia al legacy `speed_bonus` en `src/features/offers/*`.
- [ ] Performance milestones NO se renderizan ni se aceptan en el form (FEAT-016 scope).
- [ ] Submit envía `bonus_terms: { speed_bonus_windows: [...] }` ordenado por `window_hours ASC`.
- [ ] Tipos compilan contra OpenAPI nuevo (`pnpm typecheck` pasa).
- [ ] Tests cubren validaciones y submit shape para los tres tipos de Offer.
- [ ] `pnpm test` pasa.

## Done summary
Los tres problemas del round anterior están corregidos: hasBonusWindows eliminado, bonus_terms omitido cuando no hay ventanas, key estable con id de crypto.randomUUID. sortBonusTerms strip-ea correctamente el campo id interno antes del submit. Sin dead code, sin type issues, sin señales de alarma.
## Evidence
- Commits:
- Tests:
- PRs: