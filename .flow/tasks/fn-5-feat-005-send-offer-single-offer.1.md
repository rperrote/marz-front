## Description

Regenerar `src/shared/api/generated/` después de que el backend `marz-api` mergee FEAT-005 B.5 y la API de dev exponga los nuevos endpoints/schemas. Este task **no escribe código de producto**; valida que el contrato OpenAPI llegó al frontend con la shape esperada por la solution doc §4.

**Size:** S
**Files:**

- `openapi/spec.json` (committed snapshot)
- `src/shared/api/generated/endpoints.ts` (regenerado)
- `src/shared/api/generated/model/*` (regenerado)
- `src/shared/api/generated/zod/*` (regenerado)
- `.gitattributes` (verificar `linguist-generated=true` ya cubre el path)

## Approach

- Confirmar que backend B.5 está deployado en dev (preguntar al user/equipo si no consta).
- Correr `pnpm api:sync` (refetch + regenerate) — ver `marz-front/CLAUDE.md §Cliente API`.
- Inspeccionar el diff: solo deben aparecer los hooks/schemas listados en solution doc §4.4. Si aparecen cambios fuera de Offers, abrir issue al backend antes de commitear.
- No editar a mano código generado.
- Si `pnpm api:sync` falla por dev caído, abortar el task y bloquear el epic.

## Investigation targets

**Required**:

- `orval.config.ts` — config actual del generador
- `src/shared/api/mutator.ts` — fetcher custom usado por los hooks
- `marz-front/CLAUDE.md` §Cliente API — flujo `pnpm api:sync` vs `pnpm api:generate`
- `../marz-docs/features/FEAT-005-offer-single/03-solution.md` §4.3 (cambios al openapi.yaml) y §4.4 (tipos esperados)

**Optional**:

- `.gitattributes` — confirmar marker `linguist-generated`

## Key context

- Generated code se commitea (reproducibilidad + diffs visibles en review). Es decisión del repo, no negociable.
- `ChatMessageCreatedEvent` se extiende con 4 nuevos `event_type` enum members. Backward compatible: los listeners viejos los ignoran.

## Acceptance

- [ ] `pnpm api:sync` corre limpio contra dev backend con FEAT-005 B.5 mergeado.
- [ ] Hooks Orval nuevos disponibles: `useCreateSingleOffer`, `useAcceptOffer`, `useRejectOffer`, `useGetOffer`, `useGetConversationOffers`.
- [ ] Schemas Zod nuevos: `createSingleOfferRequestSchema`, `offerDtoSchema`, `offerSnapshotSchema`, `conversationOffersResponseSchema` (+ los snapshots por lifecycle).
- [ ] Tipos TS: `OfferDTO`, `OfferSnapshot`, `OfferSpeedBonus`, `OfferDeliverableDTO`, `ConversationOffersResponse`, `ArchivedOfferItem`, `OfferAcceptedSnap`, `OfferRejectedSnap`, `OfferExpiredSnap`.
- [ ] `pnpm typecheck` pasa.
- [ ] `pnpm test src/shared/api` pasa.
- [ ] Diff revisado: solo agrega lo de §4.4; nada borrado fuera de regeneración esperada. Tag interno `event_type` enum extendido sin remover values previos.
- [ ] Commit separado solo con regenerados + `openapi/spec.json` actualizado.

## Done summary

_To be filled by worker on completion._

## Evidence

_Links to commits, test runs, screenshots, etc._
