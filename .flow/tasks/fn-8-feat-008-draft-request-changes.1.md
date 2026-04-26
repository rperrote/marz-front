## Description

Sync de tipos contra el backend FEAT-008 (ya mergeado y deployado en dev) usando Orval. Incorpora hooks/types/Zod nuevos y extiende el `DomainEventEnvelope` con el caso `'changes.requested'`. No agrega lógica de runtime — es la base de tipos para todas las tareas siguientes.

**Size:** S
**Files:**

- `openapi/spec.json` (regenerado por `pnpm api:sync`)
- `src/shared/api/generated/**` (regenerado)
- `src/shared/ws/types.ts` (extender union manualmente)
- `src/shared/ws/handlers.ts` (case no-op `'changes.requested'` para que el switch type-cheque)

## Approach

- Levantar dev backend con FEAT-008 (verificar `B.5` + `B.6` mergeados). Si el backend no está listo, esta task **bloquea**.
- Correr `pnpm api:sync`. Diff esperado en `src/shared/api/generated/`: hooks `useRequestChangesMutation`, `useListChangeRequestsQuery`; tipos `ChangeRequestDTO`, `ChangeCategory` (literal union), `ChangesRequestedSnapshot`, `ListChangeRequestsResponse`; extensión de `DeliverableDTO` con `change_requests_count`, `latest_change_request`, `drafts[]`; schemas Zod equivalentes.
- Editar `src/shared/ws/types.ts` agregando `'changes.requested'` al discriminated union de `DomainEventEnvelope` con su payload `ChangesRequestedWSPayload` (importado del generated). Patrón existente en FEAT-007.
- Editar `src/shared/ws/handlers.ts` agregando un `case 'changes.requested':` no-op (placeholder; F.5 lo completa). Esto previene que TS rompa el exhaustive-check.
- Verificar `pnpm tsc --noEmit` y `pnpm lint`. Commit del diff de generated (los marcamos `linguist-generated=true` en `.gitattributes`, ya configurado).

## Investigation targets

**Required**:

- `orval.config.ts` — config actual
- `src/shared/api/mutator.ts` — fetcher custom (ya maneja auth/errors; no tocar)
- `src/shared/ws/types.ts` — definición del envelope
- `src/shared/ws/handlers.ts` — switch existente (FEAT-007)
- `src/features/deliverables/components/DraftSubmittedCard.tsx` — confirmar que consume `DeliverableDTO` (cambio transparente)

**Optional**:

- Spec contrato §4 (`marz-docs/.../03-solution.md`) para shape esperada

## Design context

No aplica — task de tipos/build, sin UI.

## Key context

- `marz-front/CLAUDE.md` §Cliente API: committeamos `src/shared/api/generated/` y `openapi/spec.json` (reproducibilidad + diff review).
- Si el backend dev aún no levantó FEAT-008, **no fabricar tipos a mano**: bloquear y avisar.

## Acceptance

- [ ] `pnpm api:sync` corre limpio contra dev y regenera `src/shared/api/generated/` con los hooks `useRequestChangesMutation`, `useListChangeRequestsQuery` y los tipos listados.
- [ ] `src/shared/ws/types.ts` incluye `'changes.requested'` en el `DomainEventEnvelope` con payload `ChangesRequestedWSPayload`.
- [ ] `src/shared/ws/handlers.ts` tiene case `'changes.requested'` (no-op, comentario `// TODO F.5`).
- [ ] `pnpm tsc --noEmit` pasa sin errores.
- [ ] `pnpm lint` pasa.
- [ ] Diff del PR muestra solo: regenerated client + 2 ediciones manuales en `ws/`.

## Done summary

_Pendiente de implementación._

## Evidence

_Pendiente de implementación._
