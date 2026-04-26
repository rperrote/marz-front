---
satisfies: [R7, R9]
---

## Description

Extender `OffersArchiveBlock` (FEAT-005) para agregar un badge de `type` (Single/Bundle/Multi-stage) en cada item. Coexistencia con badge `Pending` heredado: una offer `sent` vigente anterior muestra ambos. Consume `ArchivedOfferItem.type` (campo nuevo del backend).

**Size:** S
**Files:**

- `src/features/offers/components/OffersArchiveBlock.tsx` (modificar)
- `src/features/offers/components/OffersArchiveBlock.test.tsx` (modificar)
- `src/features/offers/components/OfferTypeBadge.tsx` (nuevo, reusable)

## Approach

- Crear `OfferTypeBadge` chico y reusable, basado en primitive `Badge` de shadcn.
- En `OffersArchiveBlock`, render del badge alineado a la derecha junto al status badge.
- Mapeo: `single` → "Single", `bundle` → "Bundle", `multistage` → "Multi-stage".

## Investigation targets

**Required:**

- `src/features/offers/components/OffersArchiveBlock.tsx` — punto de extension
- `src/components/ui/badge.tsx` — primitive
- `src/shared/api/generated/model/archivedOfferItem.ts` — typing con campo `type`

**Optional:**

- Pencil `xKNIo`, `fH0fw` — referencia visual

## Design context

- Badge chico (`text-xs`), `rounded-full`, color neutral (`--secondary` o `--muted`) para no competir con el status badge.
- Diferenciar visualmente de status badge por color/posicion.

## Acceptance

- [ ] `OffersArchiveBlock` renderiza badge de tipo en cada row.
- [ ] Coexistencia: una offer `sent` con badge `Pending` + badge `Bundle` ambas visibles.
- [ ] Tests: `rendersTypeBadge`, `coexistingPendingOffersOfDifferentTypes`.
- [ ] Validacion visual Pencil ≥95% contra `xKNIo`, `fH0fw`.
- [ ] A11y: badge con `aria-label` descriptivo si solo es color.

## Done summary

_To be filled by the worker._

## Evidence

_Logs, screenshots, or test output go here._
