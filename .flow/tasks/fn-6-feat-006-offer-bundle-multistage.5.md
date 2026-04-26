---
satisfies: [R4, R9]
---

## Description

`OfferCardBundle` y `OfferCardMultiStage`: dos cards para timeline que consumen `OfferSnapshotBundle` / `OfferSnapshotMultiStage` directamente desde el `payload` del system_event (no re-fetchear). Renderizan los 4 statuses (sent/accepted/rejected/expired) y los dos lados (out=brand, in=creator). Acciones Accept/Reject solo lado creator + status sent + offer no expirada. Reusan `OfferHeader` (Pencil `S16Gt`/`wHe34`) y para bundle: `DeliverableSummaryRow` reusable (Pencil `XVVnm` de FEAT-005). Para multistage: cards de stage `Card/Stage/Collapsed` (`sOxwt`) o `Expanded` (`mylP9`), expansion local por stage.

**Size:** M
**Files:**

- `src/features/offers/components/OfferCardBundle.tsx` (nuevo)
- `src/features/offers/components/OfferCardMultiStage.tsx` (nuevo)
- `src/features/offers/components/OfferCardBundle.test.tsx` (nuevo)
- `src/features/offers/components/OfferCardMultiStage.test.tsx` (nuevo)

## Approach

- Las acciones Accept/Reject reusan los hooks `useAcceptOffer` / `useRejectOffer` (sin cambios funcionales).
- Estado de expansion de stages en multistage card: `useState<Set<stageId>>`. Description tambien expansible (truncar a N lineas + "Ver mas").
- Reusar `OfferCardSingle` (FEAT-005) como referencia de estructura: header + body + actions + status badge.

## Investigation targets

**Required:**

- `src/features/offers/components/OfferCardSingle.tsx` (FEAT-005) — patron base
- `src/features/offers/components/DeliverableSummaryRow.tsx` (FEAT-005) — reusar para bundle
- `src/features/offers/hooks/` — `useAcceptOffer`, `useRejectOffer` regenerados
- `src/features/offers/components/OfferHeader.tsx` (FEAT-005)

**Optional:**

- Pencil `mylP9`, `sOxwt`, `eNVFQ`, `LtmDH` — referencia visual

## Design context

- Cards redondeadas (`rounded-xl`).
- Status badges: sent=`--primary`, accepted=`--success`, rejected=`--destructive`, expired=`--muted-foreground`.
- Stage card collapsed: solo titulo + deadline + status. Expanded: + description + amount.
- Boton Accept = primary, Reject = outline destructive.

## Acceptance

- [ ] `OfferCardBundle` renderiza desde `OfferSnapshotBundle`, los 4 statuses, lado out e in.
- [ ] `OfferCardMultiStage` renderiza desde `OfferSnapshotMultiStage`, expansion por stage independiente.
- [ ] Acciones disabled cuando expirada.
- [ ] Tests unit: `OfferCardBundle.rendersAllFourStatuses_outAndIn`, `OfferCardBundle.actionsDisabledWhenExpired`, `OfferCardBundle.expandsCollapsesDeliverableList`, `OfferCardMultiStage.expandsCollapsesEachStageIndependently`, `OfferCardMultiStage.descriptionExpandable`.
- [ ] Validacion visual Pencil ≥95% contra cards y screens `eNVFQ`/`LtmDH`.
- [ ] A11y: card como `role="article"`, acciones como `<button>`, status anunciado con `aria-label`.

## Done summary

_To be filled by the worker._

## Evidence

_Logs, screenshots, or test output go here._
