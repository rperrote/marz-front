---
satisfies: [R3, R4, R9, R11]
---

## Description

Nuevo componente `DraftVersionList` integrado dentro de `DeliverableListPanel` (FEAT-007) en el panel lateral derecho. Lista todas las versiones del Draft (v1..vN) con badge de estado por versión (`submitted`/`changes_requested`/`approved`), botón de play (signed URL del backend) y marca "current" en la última. Extiende `DeliverableListPanel` para deshabilitar el botón "Upload draft v(n+1)" con copy condicional según `status`.

**Size:** M
**Files:**

- `src/features/deliverables/components/DraftVersionList.tsx` (nuevo)
- `src/features/deliverables/components/__tests__/DraftVersionList.test.tsx`
- `src/features/deliverables/components/DeliverableListPanel.tsx` (modificar — FEAT-007)
- `src/features/deliverables/components/__tests__/DeliverableListPanel.test.tsx` (extender)
- `tests/e2e/feat008/draft-version-history.spec.ts` (nuevo)

## Approach

- `DraftVersionList` consume `drafts: DraftDTO[]` directamente desde `DeliverableDTO.drafts` (slot agregado en F.1; evita refetch — el data ya está en el query principal del workspace).
- Por cada `DraftDTO`:
  - Label `v{version}`, marca "current" si es `MAX(version)`.
  - Badge de estado calculado client-side desde el cruce con `latest_change_request` y `approved_at`:
    - Si `draft.approved_at` → `approved`.
    - Si existe un `ChangeRequest` con `draft_id === draft.id` → `changes_requested`.
    - Si no, y es la current → `submitted`.
  - Botón play que abre el preview del video usando `draft.playback_url` (signed URL viene del backend; si vence después de 1h, refetch via `useListDraftsQuery` — FEAT-007).
- `DeliverableListPanel` embebe `<DraftVersionList drafts={deliverable.drafts} latestChangeRequest={deliverable.latest_change_request} />` dentro de cada `Card/Deliverable`.
- Botón "Upload draft v(n+1)" en el panel:
  - Visible solo para creator (no brand).
  - Habilitado solo si `status === 'changes_requested'`.
  - Deshabilitado en `draft_submitted` con copy "Waiting for brand review".
  - Deshabilitado en `draft_approved` con copy "Draft already approved".
  - Click abre `UploadDraftDialog` (FEAT-007) con label dinámico "Upload draft v{current_version + 1}".
  - El flujo de upload reusa `useDraftUploadFlow` (FEAT-007) sin cambios.
- `change_requests_count` se renderiza como badge en el header del `Card/Deliverable` ("3 rounds" si > 0).

**Reuse points**:

- `useDraftUploadFlow` (FEAT-007) — sin cambios.
- `UploadDraftDialog` (FEAT-007) — solo recibe label dinámico.
- `useListDraftsQuery` (FEAT-007) — fallback si signed URL vence.
- Primitives shadcn (`Badge`, `Button`).

## Investigation targets

**Required**:

- `src/features/deliverables/components/DeliverableListPanel.tsx` (FEAT-007) — slot `draftsList` previsto + botón Upload existente
- `src/features/deliverables/components/UploadDraftDialog.tsx` (FEAT-007)
- `src/features/deliverables/hooks/useDraftUploadFlow.ts` (FEAT-007)
- `src/shared/api/generated/model/draftDTO.ts` (post-F.1) — shape de `DraftDTO`
- `src/components/ui/badge.tsx` — primitive shadcn

**Optional**:

- `src/features/deliverables/components/InlineVideoPlayer.tsx` — preview reusable

## Design context

Frame **pendiente** (Pencil): la spec marca que `DraftVersionList` no tiene frame todavía, es variante de `Card/Deliverable` (`zcddo`). Diseño ad-hoc usando tokens del design system:

- Lista vertical compacta, gap `$--spacing-2`.
- Cada fila: label + badge estado + botón play. Radius `$--radius-md`.
- Badge de estado usa color por estado (verde aprobado, ámbar changes_requested, azul submitted) — derivado de tokens (`--success`, `--warning`, `--info`).
- "Current" como pill con fondo `--accent`.
- Documentar screenshots en el PR para reconciliación futura cuando exista el frame.

## Acceptance

- [ ] `DraftVersionList` renderiza v1..vN con badge correcto por estado y marca "current" en la última.
- [ ] Botón play por versión abre preview con la URL firmada de esa versión.
- [ ] Estado calculado correctamente: `approved_at` → approved; existencia de `ChangeRequest` para ese `draft_id` → changes_requested; current sin ninguno → submitted.
- [ ] `DeliverableListPanel` embebe `<DraftVersionList>` dentro de cada `Card/Deliverable`.
- [ ] Badge `change_requests_count` aparece en el header del card cuando > 0.
- [ ] Botón "Upload draft v(n+1)": oculto para brand; habilitado solo en `changes_requested` para creator; copy condicional en otros estados.
- [ ] Click "Upload draft v(n+1)" abre `UploadDraftDialog` con label dinámico.
- [ ] Tests Vitest: render con 1/2/3 versiones, cálculo de estado, condicionales del botón Upload.
- [ ] E2E `tests/e2e/feat008/draft-version-history.spec.ts`: 3 rondas (v1→request→v2→request→v3→approve) muestran las 3 versiones reproducibles, última marcada "current".
- [ ] Screenshots adjuntos al PR para futura reconciliación con el frame Pencil pendiente.

## Done summary

_Pendiente de implementación._

## Evidence

_Pendiente de implementación._
