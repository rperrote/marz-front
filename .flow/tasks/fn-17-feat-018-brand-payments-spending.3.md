---
satisfies: [R5]
---

## Description

Crear server functions y hooks TanStack Query para el dashboard de payments + export CSV. Sincronizar filtros con search params de la ruta.

**Size:** M
**Files:**

- `src/features/payments/hooks/useBrandPaymentsSpendingQuery.ts` (nuevo)
- `src/features/payments/hooks/useExportBrandPaymentsCsvMutation.ts` (nuevo)
- `src/features/payments/api/getBrandPaymentsSpending.ts` (server function)
- `src/features/payments/api/exportBrandPaymentsCsv.ts` (server function)
- Tests de los hooks (mock del cliente generado)

## Approach

- Server functions con `createServerFn({ method: 'GET' })` validando input con Zod (mismo schema que `validateSearch` de la ruta + cursor para dashboard).
- Handler delega al cliente Orval generado (`getBrandWorkspacePaymentsSpending`, export CSV).
- Hook query: key estable `["brand-payments-spending", workspaceId, filters]`. `staleTime` razonable (refresh manual: alto, p.ej. 5 min). `keepPreviousData` para paginación keyset.
- Hook export mutation: maneja 409 `no_payments_to_export` y 409 `export_exceeds_limit` SIN disparar descarga; éxito devuelve blob/Response para que la UI dispare download.
- Filtros: las server fns aceptan los mismos params que `validateSearch`.

## Investigation targets

**Required:**

- `src/shared/api/mutator.ts` — auth/error handling Orval.
- Hooks de query existentes en otros features (ej. `src/features/campaigns/hooks/`) — patrón de query key + staleTime.
- `src/features/identity/` — cómo obtener `workspaceId` activo del session.

**Optional:**

- Server functions existentes (`createServerFn`) en otros features para patrón.

## Acceptance

- [ ] `useBrandPaymentsSpendingQuery(input)` devuelve typed `BrandPaymentsSpendingResponse`.
- [ ] Query key `["brand-payments-spending", workspaceId, filters]` estable; cambio en filtros invalida.
- [ ] Search params (`period`, `campaignId`, `creatorId`, `q`) se leen desde la ruta y se pasan al hook.
- [ ] `useExportBrandPaymentsCsvMutation` no descarga archivo cuando API responde 409.
- [ ] 409 `export_exceeds_limit` propaga el código para que la UI muestre el mensaje exacto.
- [ ] Tests cubren: query key estable, manejo de 409, paginación cursor.

## Done summary
Server functions, hooks y tests implementados correctamente; patrones de fetch en server functions y uso de useBrandSession son consistentes con el repo existente
## Evidence
- Commits:
- Tests:
- PRs: