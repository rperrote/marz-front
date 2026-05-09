---
satisfies: [R1, R4, R5, R8, R9]
---

## Description

Integrar el sidesheet en los 2 surfaces que exponen la acción y agregar el badge `Paid` al `ContextPanel/DeliverableItem`. Actualizar `CurrentOfferBlock` con label dinámico según el progreso de pago de los deliverables del offer.

**Size:** M
**Files:**

- `src/features/chat/components/systemEvents/LinkApprovedCard.tsx` (modificar — botón secundario)
- `src/features/chat/components/ContextPanel/DeliverableItem.tsx` (modificar — acción + badge)
- `src/features/chat/components/CurrentOfferBlock.tsx` (modificar — label dinámico)
- Tests unitarios y E2E acompañando.

## Approach

- **LinkApprovedCard**: agregar botón secundario inline `Mark as paid` con guard `viewer.kind === 'brand' && viewer.role === 'owner' && deliverable.status === 'completed'`. Click → abre `MarkAsPaidSidesheet` (estado local del card o lift al parent — seguir patrón existente). Botón desaparece cuando `status='paid'`.
- **DeliverableItem (ContextPanel)**: mismo guard para mostrar la acción. Cuando `status='paid'` → render `DeliverableStatusBadge` con `paid`.
- **CurrentOfferBlock**: leer `deliverables` del offer; computar `paidCount`/`total`. Label:
  - `total > 0 && paidCount === total` → "Fully paid".
  - `paidCount > 0 && paidCount < total` → "Partially paid (paidCount/total)".
  - `paidCount === 0` → label habitual existente sin cambio.
- No archivar el offer cuando esté `Fully paid` — la lógica de archivado existente solo se dispara al recibir una nueva offer (FEAT-006). Confirmar leyendo el código existente y no romper esa regla.

## Investigation targets

**Required**:

- `src/features/chat/components/systemEvents/LinkApprovedCard.tsx` (FEAT-009) — donde se inserta el botón secundario.
- `src/features/chat/components/ContextPanel/DeliverableItem.tsx` (FEAT-009) — donde se muestra la acción + badge.
- `src/features/chat/components/CurrentOfferBlock.tsx` (FEAT-006) — labels existentes y lógica de archivado.
- `src/features/identity/hooks/useViewer.ts` o equivalente — cómo leer `viewer.kind` y `viewer.role`.

## Design context

- **Components:** El botón secundario en `LinkApprovedCard` sigue las variantes `outline`/`ghost` del design system para no competir visualmente con el CTA principal del card.
- **Badge:** `DeliverableStatusBadge` con valor `paid` (definido en task .2).
- **Layout:** Acción `Mark as paid` aparece debajo o junto al estado `Completed`. Cuando aparece el badge `Paid`, la acción desaparece — nunca coexisten.
- **Tokens:** Usa los tokens del design system. Light + dark.

Full design system: `src/styles.css` + `marz-design/marzv2.pen` (Pencil MCP) — paneles `wpat3` (brand) y `7pW7u` (creator).

## Acceptance

- [ ] `LinkApprovedCard` muestra botón `Mark as paid` solo con el guard (`brand` + `owner` + `completed`). Brand member, admin, creator: no lo ven. Test unitario por cada combinación.
- [ ] Click abre `MarkAsPaidSidesheet` con el `deliverableId` correcto.
- [ ] Tras confirmar y recibir la invalidation WS, el botón desaparece y la card refleja el estado `paid` (vía `DeliverableStatusBadge` en el contexto que aplique).
- [ ] `ContextPanel/DeliverableItem`: misma acción con mismo guard. Tras confirmación, badge `Paid` aparece.
- [ ] `CurrentOfferBlock`:
  - Test table-driven cubre `none/partial/full` para offers `single`, `bundle`, `multistage`.
  - Label "Partially paid (1/3)" cuando 1 de 3 deliverables paid.
  - Label "Fully paid" cuando todos paid.
- [ ] El offer fully paid NO se archiva automáticamente. E2E confirma que sigue visible en el slot `CurrentOfferBlock` hasta que llega una nueva offer.
- [ ] E2E Playwright bundle: 3 deliverables completed → marcar 1 → label `Partially paid (1/3)` → marcar los 3 → label `Fully paid`.
- [ ] E2E Playwright multistage: marcar deliverables de una stage → progresión correcta del label.
- [ ] Validación visual Pencil MCP ≥95% del panel con badge `Paid` (`wpat3`, `7pW7u`).

## Done summary
console.log eliminados de getServerMe.ts; BC isolation resuelta con shared/payments/; role resuelto desde route context; multistage.deliverables requerido; tests cubren guards y flujo de sidesheet.
## Evidence
- Commits:
- Tests:
- PRs: