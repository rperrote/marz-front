# FEAT-006 — Offer Bundle & Multistage (frontend)

## Overview

Extiende el sidesheet "Send Offer" (FEAT-005, single) para soportar los tipos `bundle` y `multistage`. Agrega chooser de tipo, dos editores nuevos, dos cards de timeline, una bubble de `StageOpened`, render de stages en panel lateral, badge de tipo en archive y analytics extendido. Toda la maquinaria base (sidesheet, WS subscriber, archive, panel lateral, mutator, schemas Zod) ya existe en FEAT-005 — esta feature **extiende y discrimina por `type`**.

Este epic cubre **solo el frontend** (`marz-front`). Las tasks B.1–B.8 del solution doc viven en `marz-api` (otro repo) y no se rastrean acá. La frontera de sincronización es B.5: cuando backend mergea OpenAPI extendido en dev, este epic corre `pnpm api:sync` (F.1) y arranca todo lo demás.

## Scope

**In:**

- `OfferTypeChooser` + integración en `SendOfferSidesheet`.
- `BundleEditor` con repeater de deliverables y validaciones.
- `MultiStageEditor` con repeater de stages, deadlines strictly ascending y total derivado.
- `OfferCardBundle` y `OfferCardMultiStage` para timeline (sent/received, los 4 statuses).
- `StageOpenedBubble` para system_event de apertura de stage.
- `MultiStageStagesList` + extensión de `CurrentOfferBlock` para panel lateral.
- WS subscriber: cases `StageOpened` + placeholder `StageApproved` + invalidación de query.
- Archive: badge de tipo (bundle/multistage/single).
- Analytics: payloads extendidos + nuevos eventos `offer_type_changed_in_sidesheet`, `stage_expanded`.
- `pnpm api:sync` y migración de call sites `useCreateSingleOffer → useCreateOffer`.

**Out:**

- Backend (`marz-api` repo) — tasks B.1–B.8.
- `StageApproved` rendering completo (FEAT-009; acá solo placeholder).
- Creación de deliverables en multistage al accept (FEAT-007 lo hace lazy on-first-action).
- Mocks MSW para desarrollar antes de B.5 (decisión rechazada §12 del solution).

## Approach

1. F.1 regenera tipos Orval/Zod desde OpenAPI extendido en dev (depende de B.5 backend).
2. F.2 introduce el chooser y refactoriza `SendOfferSidesheet` para wrapearlo + reset on type change.
3. F.3 y F.4 agregan los dos editores nuevos en paralelo (mismo punto de extensión, archivos disjuntos).
4. F.5 agrega cards polimórficas para timeline, F.6 agrega panel lateral, F.7 cablea WS + ChatTimeline.
5. F.8 agrega badge en archive, F.9 cierra con analytics.

Todo se renderiza desde el snapshot del WS (`payload.snapshot.type`) sin re-fetchear, igual que FEAT-005. Validaciones del cliente reflejan las del server (§4.1 solution) pero **no son fuente de verdad** — server valida.

Pencil refs (componentes/screens del design system Marz para validación visual ≥95%): `lkDOH` (chooser), `TwbRP`/`PrjJn` (bundle editor + row), `1TkFi`/`SOlSR` (multistage editor + stage), `mylP9`/`sOxwt` (stage cards expanded/collapsed), `zKjTc`/`T0PXO`/`wpat3` (panel multistage), `eNVFQ`/`LtmDH` (offer cards screens), `xKNIo`/`fH0fw` (archive con tipo).

## Quick commands

```bash
# Regenerar cliente API tras backend dev deploy
pnpm api:sync

# Verificar tipos compilan
pnpm typecheck

# Tests unitarios del feature
pnpm test src/features/offers
pnpm test src/features/chat

# E2E (cuando esté Playwright instalado)
pnpm test:e2e --grep "bundle|multistage|StageOpened"
```

## Acceptance

- **R1:** Brand owner abre el sidesheet "Send Offer" desde una conversación y ve un chooser con tres opciones: Single, Bundle, Multi-stage. Cambiar el tipo con datos cargados muestra confirmación; al confirmar, el form se resetea.
- **R2:** Con tipo=Bundle, brand owner completa ≥2 deliverables (platform/format/quantity, amount opcional), `total_amount`, `deadline` futuro, `speed_bonus` opcional consistente, y envía. El client invoca `useCreateOffer` con el body discriminado y recibe 201 con `OfferDTO` polimórfico.
- **R3:** Con tipo=Multi-stage, brand owner completa ≥2 stages (name/description/deadline/amount), deadlines estrictamente ascendentes, sin speed_bonus. El total se deriva en runtime y se muestra read-only. Submit envía body discriminado y recibe 201.
- **R4:** Cuando llega `OfferSent`/`OfferAccepted`/`OfferRejected`/`OfferExpired` por WS con `payload.snapshot.type='bundle'`, la timeline renderiza `OfferCardBundle` (sent/received según lado, status correcto). Idem para `multistage` con `OfferCardMultiStage`.
- **R5:** Cuando llega `StageOpened` por WS, la timeline inserta un `StageOpenedBubble` con texto correcto (primera stage al accept, o "previous stage approved" cuando `prev_stage_position != null`). La query `['conversations', conversationId, 'offers']` se invalida y `MultiStageStagesList` re-deriva el status.
- **R6:** El panel lateral (`CurrentOfferBlock`) renderiza:
  - Para bundle: lista de deliverables del snapshot + total + speed_bonus + status badge.
  - Para multistage: `MultiStageStagesList` con stages individualmente colapsables. La primera no-aprobada está expandida por default; los stages `locked`/`open`/`approved` muestran badges correctos.
- **R7:** El archive (`OffersArchiveBlock`) muestra un badge de `type` (Single/Bundle/Multi-stage) en cada item. Múltiples offers `sent` vigentes coexisten con badge `Pending` + badge de tipo.
- **R8:** Analytics emite `offer_sent`/`offer_accepted`/`offer_rejected`/`offer_expired`/`offer_received_seen` con `offer_type` y campos derivados (`platform_mix`, `deliverables_count?`, `stages_count?`, `has_speed_bonus`, `total_amount_bucket`, `deadline_days_from_now`); además `offer_type_changed_in_sidesheet` y `stage_expanded` cuando aplica.
- **R9:** Validación visual Pencil ≥95% en cada componente nuevo contra el ID referenciado. A11y: `role="radiogroup"`/`role="radio"` en chooser; `<fieldset>`/`<details>`/`aria-live` según corresponda; ESC cierra confirmaciones.
- **R10:** `pnpm typecheck` y `pnpm test` pasan sin warnings nuevos. `useCreateSingleOffer` se mantiene como alias re-exportado durante un release (no rompe FEAT-005 callers).

## Early proof point

Task **fn-6-feat-006-offer-bundle-multistage.1** (regeneración Orval) prueba que el contrato polimórfico del backend está correcto: si los tipos no compilan o las uniones discriminadas no resuelven en TS, hay drift entre OpenAPI y lo que generamos. Si falla, parar y reabrir B.5 con backend antes de invertir en F.2+.

## Requirement coverage

| Req | Description                                                | Task(s)                                                                          | Gap justification |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------- |
| R1  | Chooser con tres tipos + confirmación al cambiar con datos | fn-6-feat-006-offer-bundle-multistage.2                                          | —                 |
| R2  | Bundle editor + submit                                     | fn-6-feat-006-offer-bundle-multistage.3                                          | —                 |
| R3  | Multistage editor + total derivado + submit                | fn-6-feat-006-offer-bundle-multistage.4                                          | —                 |
| R4  | Cards polimórficas en timeline                             | fn-6-feat-006-offer-bundle-multistage.5, fn-6-feat-006-offer-bundle-multistage.7 | —                 |
| R5  | StageOpened bubble + WS subscriber                         | fn-6-feat-006-offer-bundle-multistage.7                                          | —                 |
| R6  | Panel lateral con bundle + multistage stages               | fn-6-feat-006-offer-bundle-multistage.6                                          | —                 |
| R7  | Archive con badge de tipo                                  | fn-6-feat-006-offer-bundle-multistage.8                                          | —                 |
| R8  | Analytics extendido                                        | fn-6-feat-006-offer-bundle-multistage.9                                          | —                 |
| R9  | Validación visual + a11y por task                          | fn-6-feat-006-offer-bundle-multistage.2-8                                        | —                 |
| R10 | Tipos compilan + alias preservado                          | fn-6-feat-006-offer-bundle-multistage.1                                          | —                 |

## References

- Solution doc: `../../marz-docs/features/FEAT-006-offer-bundle-multistage/03-solution.md`
- Spec: `../../marz-docs/features/FEAT-006-offer-bundle-multistage/02-spec.md`
- FEAT-005 (base que extendemos): epic `fn-5-feat-005-send-offer-single-offer`
- FEAT-004 (timeline + WS subscriber): epic `fn-4-feat-004-chat-messaging-text-frontend`
- FEAT-003 (workspace shell + conversación): epic `fn-3-feat-003-workspace-shell-conversation`
