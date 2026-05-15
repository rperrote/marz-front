---
satisfies: [R4, R5]
---

## Description

Dialogs de Cancel y Mark as paid. Ambos operan sobre `Offer` (no Deliverable). `MarkAsPaidDialog` se mueve de `features/deliverables/` a `features/payments/`.

**Size:** M
**Files:**
- `src/features/offers/components/CancelOfferDialog.tsx`
- `src/features/payments/components/MarkAsPaidDialog.tsx` (nuevo path)
- `src/features/offers/hooks/useCancelOfferMutation.ts`
- `src/features/payments/hooks/useMarkOfferPaidMutation.ts`
- Tests.

## Approach

CancelOfferDialog:
- Recibe `offer: OfferDetailDTO`. Determina copy según `status`:
  - `sent` → "Cancelar oferta" (pre_accept). CTA siempre habilitada.
  - `accepted` → "Cancelar oferta aceptada" (post_accept). Solo habilitada si `offer_deadline < today` (UTC) — el cliente refleja la regla pero el backend manda. Si el backend responde 409, el dialog muestra inline:
    - `offer_not_cancellable_deadline_pending` → "Todavía no pasó el offer deadline."
    - `offer_not_cancellable_live_links` → "Hay links publicados activos para esta oferta."
    - `offer_not_cancellable_pre_accept` / `offer_not_actionable` → mensaje genérico.
- Confirm: `useCancelOfferMutation()` inyecta `Idempotency-Key`, on success invalida `['offers','current',conversationId]` y `['offers','list',conversationId]` y `['offers','detail',offerId]`.

MarkAsPaidDialog:
- Input editable inicializado en `offer.amount` (sugerido). Validación `> 0`.
- Solo se monta cuando la Offer es `accepted` y todos sus Deliverables están en `completed` o `link_approved` (gating client-side basado en `offer.deliverables[]`). Si no, el botón "Mark as paid" en el caller queda disabled.
- Submit: `useMarkOfferPaidMutation()` con `Idempotency-Key`, invalida queries de offers, deliverables y payments listings que correspondan.
- Manejo 409 `offer_not_mark_paid_eligible` y `offer_already_paid`: mostrar mensaje inline + dejar el dialog abierto.

## Design context

Modales shadcn `Dialog` con CTA destructiva (cancel) y CTA primary (mark paid). Light + Dark. Copy en español, tono directo.

## Investigation targets

**Required:**
- `src/features/deliverables/components/MarkAsPaidDialog.tsx` o `MarkAsPaidButton.tsx` — código actual a migrar/replacear.
- `src/components/ui/dialog.tsx` (shadcn).
- `src/shared/api/mutator.ts` — `Idempotency-Key` injection.

**Optional:**
- Otros dialogs con error inline + mutación (patrón a seguir).

## Acceptance

- [ ] `CancelOfferDialog` muestra copy distinto por status pre/post-accept.
- [ ] Test: 409 `offer_not_cancellable_live_links` → mensaje inline en español, dialog no cierra.
- [ ] Test: 409 `offer_not_cancellable_deadline_pending` → mensaje inline.
- [ ] Cancel happy path: invalida `['offers','current',...]`, `['offers','list',...]`, `['offers','detail',...]`.
- [ ] `MarkAsPaidDialog` movido a `src/features/payments/components/`.
- [ ] Old `MarkAsPaidButton` en `features/deliverables/` NO se borra en este task (lo hace F.7); pero NO debe seguir invocándose desde flows nuevos.
- [ ] Mark-paid happy path: amount editable, submit con `Idempotency-Key`, invalida queries de offers + deliverables + payments.
- [ ] Test: 409 `offer_already_paid` → mensaje + dialog open.
- [ ] Sin `new Date()` ni `Date.now()` en JSX.

## Done summary
BC cross-imports resueltos via shared/payments/markAsPaidEligibility.ts, new Date() inyectable por prop con tests controlados, todos los acceptance criteria cubiertos.
## Evidence
- Commits:
- Tests:
- PRs: