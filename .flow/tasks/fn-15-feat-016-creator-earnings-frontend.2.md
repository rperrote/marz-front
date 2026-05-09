---
satisfies: [R2]
---

## Description

Hooks de data y manejo de URL state para el dashboard. Define `useCreatorEarningsQuery` y `useExportCreatorEarningsMutation`, y declara `validateSearch` Zod en la ruta `/earnings` con normalización de inputs inválidos.

**Size:** M
**Files:**

- `src/features/earnings/hooks/useCreatorEarnings.ts` (nuevo)
- `src/features/earnings/hooks/useExportCreatorEarnings.ts` (nuevo)
- `src/routes/_creator/earnings.tsx` (modificar — `validateSearch`)
- `src/features/earnings/hooks/__tests__/*.test.ts` (nuevo)

## Approach

- Wrapper TanStack Query encima del hook generado por Orval para `getCreatorEarnings`. Query key: `['creator-earnings', period, q, cursor, limit]`.
- Mutation para export CSV que devuelve Blob; preservar header `X-Truncated` desde la respuesta para que el caller lo lea.
- `validateSearch` con `z.object({ period: z.enum(['30d','90d','12m','all']).catch('30d'), q: z.string().max(120).optional(), cursor: z.string().optional() })`.
- Sin Zustand. Sin MSW. Consumir endpoint dev real.

## Investigation targets

**Required**:

- `src/shared/api/mutator.ts` — manejo auth/errores del cliente Orval.
- `src/features/*/hooks/use*.ts` — patrón de wrappers existentes alrededor de hooks Orval.
- `marz-docs/features/FEAT-016-creator-earnings/03-solution.md` §4.1, §7.3.

**Optional**:

- TanStack Query best practices (`tanstack-query-best-practices` skill knowledge): query keys, `keepPreviousData` para paginación.

## Acceptance

- [ ] `useCreatorEarningsQuery({ period, q, cursor, limit })` consume el endpoint generado y retorna data tipada como `CreatorEarningsResponse`.
- [ ] `useExportCreatorEarningsMutation()` devuelve Blob + flag `truncated` derivado del header `X-Truncated`.
- [ ] `validateSearch` normaliza periodo inválido a `30d` (vía `.catch`) y rechaza `q` > 120 chars.
- [ ] Unit tests cubren: shape de query keys, normalización de periodo inválido, paso correcto de cursor.
- [ ] `pnpm typecheck` y `pnpm test` pasan.

## Done summary
validateSearch correcto, hooks tipados sin any, tests cubren todos los acceptance criteria, typecheck y test suite pasan sin errores
## Evidence
- Commits:
- Tests:
- PRs: