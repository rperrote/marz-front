# Bloqueo: B.5 pendiente

`pnpm api:sync` corrió limpio contra backend dev (`localhost:8080`) el 2026-04-27.
El spec descargado no contiene endpoints ni schemas de offers (no hay `CreateOfferRequest`, `OfferDTO`, `OfferSnapshot`, `StageOpenedSnap`).
El backend aún no mergeó el OpenAPI extendido (B.5).

Sin el contrato extendido no se pueden:

- Generar los tipos polimórficos en `src/shared/api/generated/`.
- Migrar `useCreateSingleOffer` → `useCreateOffer`.
- Validar que las uniones discriminadas compilen en TS estricto.

## Estado parcial

- `pnpm api:sync` ✅
- `pnpm typecheck` ✅ (pasa con el spec actual)
- `pnpm test src/shared/api` ✅ (11 tests pasan)
- `openapi/spec.json` actualizado con el snapshot actual (no incluye offers)
- `useCreateSingleOffer` sigue siendo un hook manual con RAFITA:BLOCKER documentado

## Desbloqueo

Coordinar con backend para mergear B.5; luego re-correr `pnpm api:sync` y retomar esta task.
