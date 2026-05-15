# FEAT-020 Offer types restructure — frontend

## Overview

Reestructura completa del modelo `Offer` en `marz-front`: un único `Offer` con `offer_mode` (`same_content | per_platform`), monto único, `tentative_publish_date`/`offer_deadline`, expiración 72hs, cancel pre/post-accept, y `Mark as paid` a nivel Offer. Drop completo de Stages, `offer_type`, multistage, `revise`, y mark-paid por Deliverable.

Esta epic cubre **solo frontend**. El backend (`marz-api`) corre en una epic paralela. La regeneración del cliente Orval depende de que los endpoints v3 estén live en dev.

Fuente técnica única: `marz-docs/features/FEAT-020-offer-types-restructure/03-solution.md` (secciones 4 y 7 son las relevantes para front).

## Scope

In:
- Regeneración de cliente Orval contra OpenAPI v3.
- Wizard `SendOfferSidesheet` alineado a Pencil `vzg1p`, con switch de modo, validators de fechas, bonos colapsables (solo `same_content`), summary de payout máximo.
- Store Zustand `sendOfferWizardStore` para preservar snapshots entre toggles de modo.
- Schemas Zod alineados a `CreateOfferRequest` v3 (piso fechas UTC, discriminated union `BonusAmount`, regla `per_platform sin bonos`).
- Dialogs `CancelOfferDialog` y `MarkAsPaidDialog` (este último movido de `deliverables/` a `payments/`, opera sobre Offer).
- Re-mapeo de cards de chat system events a snapshot v3 (`OfferSent/Accepted/Rejected/Expired/Cancelled` + `PaymentMarked`); `OfferCancelledCard` discrimina `phase`.
- `CurrentOfferCard`, `OfferArchive`, `OfferCountdown` (creator-side, decrementa visualmente desde `expires_at`).
- Cleanup de componentes legacy: `StageList`, `StageOpenedCard`, `StageApprovedCard`, `OfferTypeSelector`, `OfferReviseDialog`, `MarkAsPaidButton` (deliverable-level), y referencias a `StageOpened`/`StageApproved` en `registry.ts`.

Out:
- Cualquier cambio backend.
- E2E tests cross-stack (corre en epic de QA aparte).
- Negotiating / `revise` (drop, no se reimplementa).

## Approach

1. Esperar a que B.4 (HTTP adapters Offers) esté live en dev → `pnpm api:sync` regenera tipos v3.
2. Construir base shared: store del wizard + schema Zod (sin UI todavía).
3. Construir UI vertical por flujo: wizard → cancel/mark-paid → cards de chat → panel del workspace.
4. Cleanup final de archivos muertos cuando todos los consumidores migraron.

Convenciones del repo:
- Estructura espeja bounded contexts: `src/features/{offers,chat,deliverables,payments}/`.
- Cliente API: hooks Orval generados, `mutator.ts` inyecta auth e `Idempotency-Key`.
- Tokens visuales mapeados desde `marz-docs/marzv2.pen` a naming shadcn en `src/styles.css`.
- TanStack Query: invalidación de keys post-mutación obligatoria (CLAUDE.md §5).
- Zod via TanStack Form para validación.
- Antes de implementar cualquier UI: leer `marz-docs/DESIGN-DEV.md` y abrir el `.pen` con el MCP de Pencil.

## Quick commands

```bash
# Regenerar cliente API (requiere backend dev con v3)
pnpm api:sync

# Type check
pnpm tsc --noEmit

# Dev server
pnpm dev

# React doctor (no debe regresar score < 95)
pnpm react-doctor
```

## Acceptance

- **R1:** `src/shared/api/generated/` regenerado contra OpenAPI v3 con tipos `OfferDetailDTO`, `OfferListItemDTO`, `OfferMode`, `BonusAmount`, `BonusTerms`, `CancelPhase`, `BonusTermsSource` y hooks Orval correspondientes; `pnpm tsc --noEmit` verde.
- **R2:** Wizard `SendOfferSidesheet` permite enviar Offer en ambos modos (`same_content` y `per_platform`) con validación client-side de fechas (piso UTC hoy+4d, deadline ≥ tentative), monto > 0, plataformas únicas; bonos solo habilitados en `same_content`.
- **R3:** Store `sendOfferWizardStore` preserva snapshots de cada modo al togglear durante la misma sesión; se limpia al submit/cerrar el sidesheet.
- **R4:** `CancelOfferDialog` discrimina pre_accept (status sent) y post_accept (status accepted + deadline pasado + sin links vivos); muestra inline los errores `offer_not_cancellable_*` de la API.
- **R5:** `MarkAsPaidDialog` opera a nivel Offer, muestra `suggested_amount` editable; solo habilitado cuando todos los Deliverables del Offer están en `completed`/`link_approved`.
- **R6:** Cards de chat system events (`OfferSentCard`, `OfferAcceptedCard`, `OfferRejectedCard`, `OfferExpiredCard`, `OfferCancelledCard`, `PaymentMarkedCard`) renderizan `OfferSnapshot v3`; `OfferCancelledCard` muestra copy diferente por `phase`; `registry.ts` no referencia `StageOpened` ni `StageApproved`.
- **R7:** `CurrentOfferCard`, `OfferArchive`, `OfferCountdown` operan con DTO v3; el countdown decrementa client-side desde `expires_at` y refleja `expired` tras WS push.
- **R8:** Cleanup completo: `grep -r "Stage\|offer_type\|multistage\|OfferRevise" marz-front/src` retorna 0 hits funcionales; archivos eliminados según §7.2 del solution doc; build y tests verdes; `pnpm react-doctor` ≥ 95.

## Early proof point

Task `fn-20-feat-020-offer-types-restructure.2` (store + Zod schema) valida el shape v3 y las reglas cross-field sin depender de UI. Si los tipos de Orval no calzan con el schema Zod o las reglas de dominio (bonos solo en `same_content`, piso de fechas), reabrir la conversación con backend antes de seguir con tasks de UI.

## Requirement coverage

| Req | Description | Task(s) | Gap justification |
|-----|-------------|---------|-------------------|
| R1  | Regen Orval + tipos v3 verdes | fn-20-feat-020-offer-types-restructure.1 | — |
| R2  | Wizard SendOffer en ambos modos | fn-20-feat-020-offer-types-restructure.3 | — |
| R3  | Store wizard preserva snapshots | fn-20-feat-020-offer-types-restructure.2, fn-20-feat-020-offer-types-restructure.3 | — |
| R4  | CancelOfferDialog pre/post-accept | fn-20-feat-020-offer-types-restructure.4 | — |
| R5  | MarkAsPaidDialog a nivel Offer | fn-20-feat-020-offer-types-restructure.4 | — |
| R6  | Cards chat v3 + cancel discriminado | fn-20-feat-020-offer-types-restructure.5 | — |
| R7  | CurrentOfferCard/Archive/Countdown | fn-20-feat-020-offer-types-restructure.6 | — |
| R8  | Cleanup legacy + react-doctor ≥95 | fn-20-feat-020-offer-types-restructure.7 | — |

## References

- Solution doc: `marz-docs/features/FEAT-020-offer-types-restructure/03-solution.md` (secciones 4, 5, 7).
- Spec de producto: `marz-docs/features/FEAT-020-offer-types-restructure/02-spec.md`.
- Diseño Pencil: `marz-docs/marzv2.pen` — componente `Component/Sidesheet/SendOffer/OfferModelV2` (`vzg1p`). Abrir con MCP de Pencil, no con Read.
- Guía dev de diseño: `marz-docs/DESIGN-DEV.md`.
- Repo CLAUDE.md (`marz-front/CLAUDE.md` y root) para convenciones de TanStack/Orval/styles/WS.
