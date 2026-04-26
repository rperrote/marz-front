---
satisfies: [R7]
---

## Description

Instrumentar los 7 analytics events del §10 spec (`request_changes_modal_opened`, `_dismissed`, `change_request_submitted`, `request_changes_card_seen`, `draft_v2_upload_started`, `time_to_resolve_round`, `deliverable_total_rounds`) usando el endpoint genérico `POST /api/v1/analytics/events` (FEAT-002). No se trackean textos libres (notas, filenames, campaign name, creator display name).

**Size:** S/M
**Files:**

- `src/features/deliverables/analytics.ts` (extender — creado en FEAT-007)
- `src/features/deliverables/analytics.test.ts` (extender)
- `src/features/deliverables/components/RequestChangesModal.tsx` (instrumentar — F.2)
- `src/features/deliverables/components/RequestChangesCard.tsx` (instrumentar `IntersectionObserver` — F.3)
- `src/features/deliverables/hooks/useRequestChangesFlow.ts` (instrumentar submit — F.2)
- `src/shared/ws/handlers.ts` (instrumentar `time_to_resolve_round` y `deliverable_total_rounds` al recibir `draft.submitted` / `draft.approved` — F.5)

## Approach

- Extender `analytics.ts` con helpers tipados, uno por evento. Cada helper recibe el payload exacto de la spec §10 y llama al endpoint genérico via `mutator`.
- Disparos:
  - `request_changes_modal_opened`: en `RequestChangesModal` `useEffect` mount.
  - `request_changes_modal_dismissed`: en `RequestChangesModal` cleanup (sin submit), incluye `time_in_modal_seconds` (timestamp diff).
  - `change_request_submitted`: en `useRequestChangesFlow.submit` post-success.
  - `request_changes_card_seen`: en `RequestChangesCard` con `IntersectionObserver` (threshold 0.5, debounce). Solo para `viewer_kind === 'creator'`. Calcula `time_since_request_seconds` desde `requested_at` del snapshot.
  - `draft_v2_upload_started`: en `useDraftUploadFlow` (FEAT-007) cuando se inicia upload **y** el deliverable estaba en `changes_requested` previo (chequeo del status pre-upload). Calcula `time_from_request_to_upload_seconds`.
  - `time_to_resolve_round`: WS handler — al recibir `draft.submitted` (resolution=`another_round`) o `draft.approved` (resolution=`approved`).
  - `deliverable_total_rounds`: WS handler — al recibir `draft.approved`. `total_rounds = change_requests_count` del snapshot del deliverable.
- Tests con `fetch` mock que afirman shape exacta del body (incluyendo absencia de campos prohibidos).

**Reuse points**:

- `analytics.ts` (FEAT-007) — helpers existentes + endpoint genérico.
- Patrón de `IntersectionObserver` de FEAT-003/004 si existe; si no, encapsular en hook simple.

## Investigation targets

**Required**:

- `src/features/deliverables/analytics.ts` (FEAT-007) — helpers existentes
- `src/features/deliverables/hooks/useDraftUploadFlow.ts` (FEAT-007) — hook a instrumentar
- `src/shared/ws/handlers.ts` — para `time_to_resolve_round` y `deliverable_total_rounds`

**Optional**:

- Spec §10 (`marz-docs/.../03-solution.md`) — payloads exactos

## Design context

No aplica — task de instrumentación.

## Acceptance

- [ ] Los 7 helpers tipados existen en `analytics.ts` con TypeScript types que matchean la spec §10.
- [ ] `request_changes_modal_opened` y `_dismissed` se disparan al montar/desmontar el modal sin submit.
- [ ] `change_request_submitted` se dispara en submit exitoso con `categories`, `categories_count`, `has_notes`, `round_index`. **Notas crudas no incluidas**.
- [ ] `request_changes_card_seen` se dispara una sola vez por card visible (debounce/once) solo para `viewer_kind='creator'`.
- [ ] `draft_v2_upload_started` se dispara solo si pre-upload status era `changes_requested`.
- [ ] `time_to_resolve_round` y `deliverable_total_rounds` se disparan al recibir los WS correspondientes.
- [ ] Tests Vitest con `fetch` mock verifican shape exacta del body (positive + negative: campos prohibidos ausentes).
- [ ] `pnpm tsc --noEmit` y `pnpm lint` pasan.

## Done summary

_Pendiente de implementación._

## Evidence

_Pendiente de implementación._
