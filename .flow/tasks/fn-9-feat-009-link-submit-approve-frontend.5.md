---
satisfies: [R3, R4]
---

## Description

Wirea las acciones brand-owner de `LinkSubmittedCard` con sus mutations:

- "Approve link" → `useApproveLinkMutation` (optimistic en `['deliverable', id]` → status `completed`).
- "Request changes on link" → abre `Modal/RequestChanges` (existente, `ZEKzd`) en modo `target='link'`; al confirmar, dispara `useRequestLinkChangesMutation`.

Incluye los hooks de wrapping con manejo de errores e invalidación de queries.

**Size:** M
**Files:**

- `src/features/deliverables/hooks/useApproveLink.ts` (nuevo)
- `src/features/deliverables/hooks/useRequestLinkChanges.ts` (nuevo)
- `src/features/deliverables/components/LinkSubmittedCard.tsx` (modificar — wirear callbacks)
- `src/features/deliverables/components/RequestChangesModal.tsx` (modificar — agregar prop `target`)
- `tests/e2e/link-approve.spec.ts`, `tests/e2e/link-request-changes.spec.ts` (nuevos)

## Approach

- `useApproveLinkMutation`:
  - Optimistic update: `setQueryData(['deliverable', id], old => ({ ...old, status: 'completed' }))`.
  - `onError`: rollback con snapshot previo.
  - `onSettled`: invalidar `['deliverable', id]` y `['deliverable', id, 'links']`.
  - `Idempotency-Key` por intento.
- `useRequestLinkChangesMutation`:
  - NO optimistic (cambia varios campos: link.status, deliverable.status, crea ChangeRequest).
  - `onSuccess`: invalidar las 2 queries.
- `Modal/RequestChanges`: agregar prop `target: 'draft' | 'link'`. Copy del header/CTA cambia: "Request changes on draft" vs "Request changes on link". Body del modal (categorías + notas) sin cambios. La validación `notes obligatorio si "other" ∈ categories` se mantiene.
- Errores tipados:
  - Approve `409 INVALID_LINK_STATUS` → toast "Link is no longer pending review."
  - Approve `403` → toast "Only brand owner can approve links."
  - Request-changes `409 CHANGE_REQUEST_ALREADY_EXISTS` → toast "Changes already requested on this link."

## Investigation targets

**Required:**

- `src/features/deliverables/components/RequestChangesModal.tsx` — modal existente FEAT-008
- `src/features/deliverables/hooks/useRequestDraftChanges.ts` (o equivalente FEAT-008) — patrón de hook
- `src/features/deliverables/hooks/useApproveDraft.ts` (FEAT-007) — patrón de optimistic update

**Optional:**

- `src/components/ui/toast.tsx` (o sonner) — sistema de toast del proyecto

## Acceptance

- [ ] E2E: brand owner clickea "Approve link" → card pasa a "Link approved" → panel lateral refresca a `completed` con badge "Link approved" → backend reporta `deliverable.status='completed'`.
- [ ] E2E: brand owner clickea "Request changes on link" → modal abre con título "Request changes on link" → selecciona categoría + notas → confirma → deliverable vuelve a `draft_approved`, link a `changes_requested`, creator ve "Submit link" disponible nuevamente.
- [ ] E2E: brand member NO ve los botones (snapshot/visibilidad).
- [ ] Optimistic approve: status cambia inmediato en UI; rollback en error.
- [ ] FEAT-008 sigue funcionando: modal con `target='draft'` default sin cambios de comportamiento.
- [ ] Toasts de error tipados aparecen para los 3 casos cubiertos.

## Done summary
Los tres issues del round anterior resueltos: setOpen(false) en draftFlow y linkFlow onSuccess, mensajes de error unificados en inglés, y comentario en DeliverableListItem sobre completed.
## Evidence
- Commits:
- Tests:
- PRs: