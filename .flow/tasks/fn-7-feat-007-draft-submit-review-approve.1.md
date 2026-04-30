---
satisfies: [R1]
---

## Description

Regenerar el cliente API tipado (Orval) contra el backend dev con los nuevos endpoints de FEAT-007 ya levantados, y extender el discriminated union de WS para los 4 nuevos `event_type`.

**Size:** S
**Files:**

- `openapi/spec.json` (snapshot del OpenAPI fetcheado)
- `src/shared/api/generated/endpoints.ts` (regenerado)
- `src/shared/api/generated/model/*` (regenerado)
- `src/shared/api/generated/zod/*` (regenerado)
- `src/shared/ws/types.ts` (manual: agregar 4 event types al union `DomainEventEnvelope<T>`)

## Approach

- Confirmar con backend que B.6 está deploy en dev y los 6 endpoints responden (ver §4.1 del solution doc).
- Correr `pnpm api:sync` (no `pnpm api:generate` — necesitamos el fetch fresco).
- Inspeccionar diff: deben aparecer 6 nuevos hooks (`useRequestDraftUploadMutation`, `useCompleteDraftUploadMutation`, `useCancelDraftUploadMutation`, `useApproveDraftMutation`, `useGetConversationDeliverablesQuery`, `useListDraftsQuery`) + sus schemas Zod.
- Editar `src/shared/ws/types.ts` manualmente (Orval no toca WS): agregar al `DomainEventEnvelope` union los 4 event types nuevos:
  - `DraftSubmittedWSPayload` (event_type `'draft.submitted'`)
  - `DraftApprovedWSPayload` (event_type `'draft.approved'`)
  - `DeliverableChangedWSPayload` (event_type `'deliverable.changed'`)
  - `StageApprovedWSPayload` (event_type `'stage.approved'`) — `'stage.opened'` ya existe (FEAT-006).
- Las shapes de payload están en §4.2 del solution doc. Mantener naming snake_case del backend (matches `DomainEventEnvelope` actual).

## Investigation targets

**Required:**

- `orval.config.ts` — config actual de generación (mutator, output paths)
- `src/shared/api/mutator.ts` — fetcher custom; verificar que cubre los nuevos endpoints sin cambios
- `src/shared/ws/types.ts` — discriminated union actual (FEAT-003)
- `src/shared/ws/useWebSocket.ts` — hook que consume el union (no se modifica acá)
- `package.json` — scripts `api:sync` / `api:generate` y env vars (`VITE_API_URL`)

**Optional:**

- `marz-docs/features/FEAT-007-draft-submit-review/03-solution.md` §4.2 (shapes WS) y §4.4 (lista de hooks esperados)

## Key context

- `pnpm api:sync` requiere `VITE_API_URL` apuntando al dev backend con los endpoints ya en producción del entorno dev. Si el endpoint 404ea, el spec se regenera incompleto. Validar antes de commitear.
- `src/shared/api/generated/` está marcado `linguist-generated=true` — el PR debe colapsar el diff en GitHub. Igual hay que revisar que no aparezcan cambios fuera de los 6 endpoints (regresiones del spec rompen el typecheck).
- `noUncheckedIndexedAccess` activo: los nullable fields del DTO (`current_version`, `current_draft`, `playback_url`, `thumbnail_url`, `duration_sec`, `mime_type`) deben tipar `T | null` correctamente — verificar en el generated.

## Acceptance

- [ ] `pnpm api:sync` corre sin errores y regenera `src/shared/api/generated/`.
- [ ] Diff del PR muestra los 6 hooks nuevos con sus tipos de request/response.
- [ ] `src/shared/ws/types.ts` exporta los 4 nuevos `WSPayload` types y los incluye en el `DomainEventEnvelope` discriminated union.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] `pnpm lint` pasa sin warnings nuevos.
- [ ] Smoke import en un archivo cualquiera de los 6 hooks sin errores de tipo.

## Done summary

Los 4 interfaces de payload (DraftSubmittedWSPayload, DraftApprovedWSPayload, DeliverableChangedWSPayload, StageApprovedWSPayload) y los 2 snapshots auxiliares (DraftSubmittedSnapshot, DraftApprovedSnapshot) matchean campo a campo con §4.2 del solution doc FEAT-007. Los tipos snake_case, nullabilidad y required/optional son correctos. deliverable: unknown en DeliverableChangedWSPayload es aceptable y está justificado (B.6 no deployado, se tipará cuando Orval regenere). La extensión del discriminated union DomainWsEvent sigue el patrón existente sin romper nada. El comentario en DeliverableChangedWSPayload es el único comentario en el archivo y documenta una restricción técnica real (blocker externo), no estado de tarea. Sin observaciones.

## Evidence

- Commits:
- Tests:
- PRs:
