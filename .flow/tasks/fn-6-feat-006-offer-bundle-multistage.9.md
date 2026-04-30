---
satisfies: [R8]
---

## Description

Extender `trackOfferEvent` (FEAT-005) para soportar los nuevos payloads y agregar dos eventos nuevos:

- `offer_sent`: agregar `offer_type`, `platform_mix` (lista de plataformas unicas), `deliverables_count?`, `stages_count?`, `has_speed_bonus`, `total_amount_bucket`, `deadline_days_from_now` (para multistage usa el deadline maximo).
- `offer_received_seen`, `offer_accepted`, `offer_rejected`, `offer_expired`: agregar `offer_type`.
- `offer_type_changed_in_sidesheet` (nuevo): `{ actor_kind: 'brand', from_type, to_type, had_data: boolean }`.
- `stage_expanded` (nuevo): `{ actor_kind, offer_type: 'multistage', stage_index, surface: 'card' | 'panel' }`.
- `stage_opened` y `stage_approved` NO se emiten desde el cliente (decision del solution doc — backend metric).

**Size:** S
**Files:**

- `src/features/offers/analytics/trackOfferEvent.ts` (modificar)
- `src/features/offers/analytics/trackOfferEvent.test.ts` (modificar)
- Call sites en componentes: `OfferTypeChooser`, `OfferCardMultiStage`, `MultiStageStagesList`

## Approach

- Reusar el bucket existente de `total_amount_bucket` (FEAT-005) sin cambios.
- `platform_mix`: derivar de `deliverables[].platform` (bundle) o `[]` (multistage).
- Helpers para nuevos eventos en el mismo modulo, con tipos discriminados.
- `stage_expanded` se emite tanto desde la card como desde el panel (campo `surface`).

## Investigation targets

**Required:**

- `src/features/offers/analytics/trackOfferEvent.ts` (FEAT-005) — modulo a extender
- `src/shared/analytics/` — endpoint generico `/api/v1/analytics/events` (si existe wrapper)
- Call sites de `trackOfferEvent` actuales para no romperlos

## Acceptance

- [ ] `trackOfferEvent` acepta los nuevos campos manteniendo backward-compat para `single`.
- [ ] Eventos nuevos `offer_type_changed_in_sidesheet` y `stage_expanded` exportados y wireados en los call sites correctos.
- [ ] Tests unit: una assertion por evento verificando shape correcto del payload, incluido `offer_type` en todos los lifecycle events.
- [ ] Bucket `total_amount_bucket` reusa los ranges de FEAT-005 sin redefinirlos.
- [ ] Verificacion: `stage_expanded` se dispara cuando el usuario expande una stage en card o panel.

## Done summary
Analytics refactor completo y correcto. OfferSentPayload discriminated union bien tipada con campos opcionales por variante. toPlatformMix y maxDeadlineFromNow extraídas y exportadas con cobertura de tests incluyendo edge cases (array vacío). Analytics movidas fuera de updaters en MultiStageStagesList y OfferCardMultiStage — handleToggleStage/handleToggle leen estado antes del set, sin race condition. pendingOfferTypeHadData se resetea en todos los paths (open, close, cancelTypeChange, confirmTypeChange). offerType requerido en AcceptVariables/RejectVariables propagado a todos los call sites en tests. offer_type agregado en offer_received_seen/offer_accepted/offer_rejected con tipos compatibles. platform_mix, total_amount_bucket y deadline con maxDeadlineFromNow correctos en los tres hooks de creación.
## Evidence
- Commits:
- Tests:
- PRs: