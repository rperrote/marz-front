---
satisfies: [R7]
---

## Description

Habilitación condicional de "Submit link" en multistage: solo deliverables cuya `stage` esté `open` (no `locked`) y `status='draft_approved'` muestran la acción. Aprobar el último link de la stage activa cierra la stage y abre la siguiente; el front escucha `StageOpened` y refresca el panel.

**Size:** S
**Files:**

- `src/features/deliverables/components/BrandContextPanelDeliverable.tsx` (extender lógica de visibilidad)
- `src/features/deliverables/components/CreatorContextPanelDeliverable.tsx` (idem)
- `src/shared/ws/handlers/stageOpened.ts` (verificar existente FEAT-006 — agregar invalidación de `['deliverable', *]` si no la tiene)
- `tests/e2e/link-multistage.spec.ts` (nuevo)

## Approach

- Lógica de visibilidad: `canSubmitLink = isCreator && deliverable.status === 'draft_approved' && stage.status !== 'locked'`. Si la oferta no es multistage, `stage.status` se trata como `open`.
- `StageOpened` WS handler (existente FEAT-006): asegurar que invalida queries de los deliverables de la nueva stage (o que el panel re-renderiza con nuevo estado de stage).
- No hay nueva mutation; reusa todo del flujo single-stage.

## Investigation targets

**Required:**

- `src/features/offers/hooks/` — convenciones de stages (FEAT-006)
- `src/shared/ws/handlers/stageOpened.ts` (o equivalente) — handler WS existente
- `src/features/deliverables/components/BrandContextPanel/V2/MultiStage.tsx` (zKjTc) — panel multistage

**Optional:**

- Frames Pencil multistage si hay (no listados explícitamente en spec)

## Acceptance

- [ ] Unit test: deliverable de stage `locked` → botón "Submit link" no se renderiza.
- [ ] Unit test: deliverable de stage `open` y status `draft_approved` → botón visible para creator.
- [ ] E2E: aprobar último link de la stage activa → backend emite `StageApproved` + `StageOpened` → panel del front refresca, deliverables de la nueva stage muestran "Submit draft" (FEAT-007); deliverables de la stage cerrada quedan en `completed`.
- [ ] E2E: aprobar último link de la última stage → no abre stage nueva, oferta queda lista para release (no rompe).

## Done summary
Fix aplicado: canSubmitLink usa !isLocked consistente con el resto del componente; tests de unit y E2E cubren los acceptance criteria de la spec.
## Evidence
- Commits:
- Tests:
- PRs: