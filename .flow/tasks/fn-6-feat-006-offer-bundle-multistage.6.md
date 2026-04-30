---
satisfies: [R6, R9]
---

## Description

`MultiStageStagesList` para usar dentro del panel lateral (`CurrentOfferBlock`, FEAT-005). Cada stage es un `<details>` colapsable. Default-expansion: cuando `status='sent'` la primera no-aprobada (= primera) esta expandida; cuando `status='accepted'` la stage `open` (typically position=1 inicialmente) esta expandida. Status por stage derivado de `opened_at`/`approved_at` del DTO (no de re-derivar del payload). Extender `CurrentOfferBlock` con switch sobre `current.type` para renderizar bundle (lista de deliverables + total + speed_bonus) o multistage (este componente).

**Size:** M
**Files:**

- `src/features/offers/components/MultiStageStagesList.tsx` (nuevo)
- `src/features/offers/components/MultiStageStagesList.test.tsx` (nuevo)
- `src/features/offers/components/CurrentOfferBlock.tsx` (modificar)
- `src/features/offers/components/CurrentOfferBlock.test.tsx` (modificar)

## Approach

- Stages vienen del DTO `OfferDTO.stages[]` con `status: 'locked' | 'open' | 'approved'`. No re-derivar.
- Usar `<details>` HTML nativo o un primitive controlled (`Disclosure` de shadcn si existe). Estado de expansion local; no Zustand.
- Para bundle, mostrar items con `OfferDeliverableDTO`; total = `OfferDTO.total_amount`; speed_bonus si presente.

## Investigation targets

**Required:**

- `src/features/offers/components/CurrentOfferBlock.tsx` (FEAT-005) — punto de extension
- `src/shared/api/generated/model/offerDto.ts` — typing de `OfferDTO`
- `src/components/ui/` — primitives de details/disclosure si existen

**Optional:**

- Pencil `zKjTc`, `T0PXO`, `wpat3` — referencia visual del panel multistage

## Design context

- Stage row collapsed: titulo + deadline + status badge (alineado a la derecha).
- Stage row expanded: + description + amount.
- Badges: `Locked` neutro (`--muted`), `Open` primario, `Approved` success.
- Bordes redondeados consistentes.

## Acceptance

- [ ] `MultiStageStagesList` renderiza stages con badges correctos.
- [ ] Default-expansion: primera stage cuando sent; primera `open` cuando accepted.
- [ ] Cada stage colapsa/expande individualmente; el toggle no afecta a otros.
- [ ] `CurrentOfferBlock` switch por `type`: bundle muestra lista de deliverables, multistage monta `MultiStageStagesList`.
- [ ] Tests: `firstStageExpandedByDefault_whenSent`, `firstOpenStageExpandedByDefault_whenAccepted`, `collapsedShowsTitleDeadlineStatus`, `expandedShowsAllFields`, `CurrentOfferBlock.rendersBundle`, `CurrentOfferBlock.rendersMultiStage`.
- [ ] Validacion visual Pencil ≥95% contra `zKjTc`, `T0PXO`, `wpat3`.
- [ ] A11y: `<details>/<summary>` o `aria-expanded` correcto; navegable con teclado.

## Done summary

Implementación completa: MultiStageStagesList con expansión correcta, switch por type en CurrentOfferBlock, todos los tests requeridos pasan, typecheck y lint limpios

## Evidence

- Commits:
- Tests:
- PRs:
