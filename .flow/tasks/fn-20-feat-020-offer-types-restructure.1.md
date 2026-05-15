---
satisfies: [R1]
---

## Description

Regenerar el cliente Orval contra el OpenAPI v3 del backend (live en dev tras B.4). El generated va a `src/shared/api/generated/` (gitignored). No se commitea código generado.

**Size:** S
**Files:**
- `orval.config.ts` (verificar si necesita ajustes mínimos)
- `src/shared/api/generated/**` (regenerado, no commiteado)

## Approach

- Confirmar que `marz-api` dev sirve el OpenAPI v3 (endpoints: `POST /v1/offers`, `accept`, `reject`, `cancel`, `mark-paid`; `GET /v1/offers/:id`, `/v1/campaigns/:id/offers`, `/v1/conversations/:id/offers`).
- Correr `pnpm api:sync`.
- Verificar que los tipos DTOs y hooks generados matchean §4.4 del solution doc (`OfferDetailDTO`, `OfferListItemDTO`, `OfferMode`, `BonusAmount`, `BonusTerms`, `CancelPhase`, `BonusTermsSource`, `SocialPlatform`).
- `pnpm tsc --noEmit` debe pasar — si hay errores en consumidores actuales (cards viejas con shape v2, etc.), no corregir en este task: dejar el error visible para que las tasks siguientes lo resuelvan al migrar cada consumidor. Documentar en el PR los archivos rotos esperados.

## Investigation targets

**Required:**
- `orval.config.ts` — config actual.
- `src/shared/api/generated/` — ver shape actual antes de regenerar para comparar.
- `marz-front/CLAUDE.md` — flujo de `pnpm api:sync` y `mutator.ts`.

**Optional:**
- `src/shared/api/mutator.ts` — verifica que el inyector de `Idempotency-Key` y auth siga funcionando con los nuevos hooks (no debería requerir cambios).

## Acceptance

- [ ] `pnpm api:sync` corrió contra dev sin errores.
- [ ] Tipos generados incluyen `OfferDetailDTO`, `OfferListItemDTO`, `OfferMode`, `BonusAmount` (discriminated union `percentage|fixed`), `BonusTerms`, `CancelPhase`, `BonusTermsSource`.
- [ ] Hooks generados existen: create/accept/reject/cancel/mark-paid + queries de detail/list.
- [ ] Lista de archivos rotos por shape v2 documentada en el PR para guiar las próximas tasks.

## Done summary

_To be filled at task completion._

## Evidence

_To be filled at task completion._
