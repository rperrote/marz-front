---
satisfies: [R5]
---

## Description

Soporte para re-submit de link antes de aprobación: cuando el link previo está en `submitted` o `changes_requested`, el creator puede abrir nuevamente el sidesheet y enviar un link nuevo. La card vieja queda inmutable en su posición cronológica; la nueva aparece al final del chat. El panel lateral muestra siempre la URL del link "current" (status submitted o approved) usando `current_link_id` del response de `GET /links`.

**Size:** S
**Files:**

- `src/features/deliverables/hooks/useDeliverableLinks.ts` (nuevo, wrap de `useListLinksQuery`)
- `src/features/deliverables/components/SubmitLinkSidesheet.tsx` (modificar — habilitar apertura desde estado `link_submitted`/`changes_requested` cuando caller=creator)
- `src/features/deliverables/components/BrandContextPanelDeliverable.tsx` y `CreatorContextPanelDeliverable.tsx` (o nombres equivalentes — modificar para usar `current_link_id`)
- `tests/e2e/link-resubmit.spec.ts` (nuevo)

## Approach

- `useDeliverableLinks(deliverableId)`: query lazy desde el panel lateral. `staleTime` corto (segundos) ya que WS la actualiza; mantener cardinalidad <10.
- Panel lateral: si `current_link_id != null` → renderizar URL del link en esa posición. Si null → estado vacío.
- Habilitación de "Submit link" en panel/composer:
  - `deliverable.status === 'draft_approved'` y caller=creator → "Submit link".
  - `deliverable.status === 'link_submitted'` y caller=creator → "Re-submit link" (mismo sidesheet, copy distinto).
  - Otros estados → oculto.
- El sidesheet en sí no cambia: la mutation backend hace supersede automáticamente; el front solo dispara el mismo POST.

## Investigation targets

**Required:**

- `src/features/deliverables/components/BrandContextPanel*.tsx`, `CreatorContextPanel*.tsx` — panels existentes
- `src/features/deliverables/components/SubmitLinkSidesheet.tsx` (de task .3)

**Optional:**

- Lógica de "Submit draft" / "Re-submit draft" de FEAT-007/008 como referencia de copy condicional

## Acceptance

- [ ] E2E: creator submit → sin aprobar → submit otra vez → la card vieja sigue inmutable en su lugar cronológico, la nueva al final, panel muestra URL de la última.
- [ ] E2E: link en `changes_requested` → creator re-submit → backend retorna 201 con link nuevo → panel actualiza a `link_submitted`.
- [ ] Unit test: panel consume `current_link_id` del response de `GET /links` correctamente; null → estado vacío.
- [ ] Copy del botón cambia: "Submit link" en `draft_approved`, "Re-submit link" en `link_submitted` (y `draft_approved` con CR previa, si aplica).
- [ ] Mutation reusa el endpoint POST único (no hay endpoint separado de re-submit).

## Done summary
Duplicación de sets eliminada, E2E conectado a fixture testUser con signIn — ambos bloqueantes resueltos, sin issues nuevos.
## Evidence
- Commits:
- Tests:
- PRs: