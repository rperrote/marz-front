---
satisfies: [R2, R5, R9, R11]
---

## Description

Componente `RequestChangesCard` (saliente brand / entrante creator) que renderiza el snapshot inmutable de un `ChangeRequest` en la timeline del chat. Branching nuevo en `Timeline` para `event_type === 'ChangesRequested'`. Extensión de `DraftSubmittedCard` (FEAT-007) con botón "Request changes" condicional por rol (solo Brand owner), versión (deshabilitado si no es current) y status del deliverable (oculto en `changes_requested`/`draft_approved`).

**Size:** M
**Files:**

- `src/features/deliverables/components/RequestChangesCard.tsx` (nuevo)
- `src/features/deliverables/components/__tests__/RequestChangesCard.test.tsx`
- `src/features/chat/components/Timeline.tsx` (modificar)
- `src/features/deliverables/components/DraftSubmittedCard.tsx` (modificar — FEAT-007)
- `src/features/deliverables/components/__tests__/DraftSubmittedCard.test.tsx` (extender)
- `tests/e2e/feat008/request-changes-single.spec.ts` (nuevo)

## Approach

- `RequestChangesCard` consume `ChangesRequestedSnapshot` desde el `chat.message.payload` (cuando se hidrata por history) o desde el WS payload (cuando es live). Renderiza:
  - Versión referenciada (`v{draft_version}`)
  - Miniatura (si `draft_thumbnail_url` está presente)
  - Chips de `categories` (read-only, reusa `ChangeCategoryChip` con prop `readOnly`)
  - Texto de notas (plain text, sin HTML; renderizado como `textContent`)
  - Timestamp formateado
  - Variante `outgoing` (brand) vs `incoming` (creator) según `viewer_kind` derivado del `account.kind` actual.
- `Timeline` agrega un branch en su switch:
  - `case 'ChangesRequested': return <RequestChangesCard snapshot={message.payload} viewerKind={...} />`
- `DraftSubmittedCard` recibe nuevas props derivadas:
  - `canRequestChanges: boolean` — true si `viewer_kind === 'brand'` y `viewer_role === 'owner'` y `deliverable.status === 'draft_submitted'` y `card.draft_version === deliverable.current_version`.
  - Botón "Request changes" al lado de "Approve draft" (solo si `canRequestChanges`).
  - Estado deshabilitado con copy "A newer version was submitted" cuando `card.draft_version < deliverable.current_version`.
  - Click → abre `RequestChangesModal` (F.2). El modal recibe `deliverableId` y `currentDraftId`.
- Listen WS `'draft.submitted'` (FEAT-007 ya invalida el query) — al recibir nueva versión, las cards viejas re-renderizan con `card.draft_version < current_version` y el botón se deshabilita automáticamente.

**Reuse points**:

- `ChangeCategoryChip` (F.2) en modo readOnly.
- `Timeline` switch existente — solo agregar un case, no reescribir.
- Botón "Approve draft" (FEAT-007) — usar la misma posición/estilo y agregar el secundario al lado.
- Para variante saliente/entrante seguir el patrón establecido en `DraftSubmittedCard`/`DraftApprovedCard` (FEAT-007).

## Investigation targets

**Required**:

- `src/features/chat/components/Timeline.tsx` — switch existente por `event_type`
- `src/features/deliverables/components/DraftSubmittedCard.tsx` (FEAT-007) — patrón de card outgoing/incoming + botón "Approve"
- `src/features/deliverables/components/DraftApprovedCard.tsx` (FEAT-007) — referencia de card system_event inmutable
- `src/shared/auth/` — cómo derivar `viewer_kind` y `viewer_role` (sesión Clerk + memberships)
- `src/shared/api/generated/model/` — tipos `ChangesRequestedSnapshot`, `DeliverableDTO`

**Optional**:

- `src/features/deliverables/components/InlineVideoPlayer.tsx` — para abrir miniatura clickeable

## Design context

Frames Pencil: `a4UgN`/`txulr` (brand post-send card outgoing), `nK6FB`/`H2DA6` (creator entrante), `BIuqZ` (instancia `RequestChangesCard` librería), `y54vb`/`Xu3OI` (brand viendo draft v2 con request anterior arriba). Validación ≥95% light + dark.

- Card sigue convención de timeline existente (radius `$--radius-lg`, fondo `--card`, padding `$--spacing-4`).
- Variante outgoing alineada a la derecha; incoming a la izquierda (patrón FEAT-004).
- Chips read-only usan tono más bajo de saturación que el seleccionable.
- Botón "Request changes" en `DraftSubmittedCard` es secondary (no primary — "Approve draft" tiene esa jerarquía).

## Acceptance

- [ ] `RequestChangesCard` renderiza correctamente: versión, miniatura, categorías, notas, timestamp; saliente vs entrante según `viewer_kind`.
- [ ] Notas vacías → placeholder visual (no string vacío crudo).
- [ ] `Timeline` muestra `RequestChangesCard` cuando `event_type === 'ChangesRequested'`.
- [ ] `DraftSubmittedCard` muestra botón "Request changes" solo si Brand owner sobre la versión actual y deliverable en `draft_submitted`.
- [ ] Botón deshabilitado con copy "A newer version was submitted" cuando hay versión más reciente; oculto cuando status es `changes_requested` o `draft_approved`.
- [ ] Click abre `RequestChangesModal` con `deliverableId` y `currentDraftId` correctos.
- [ ] Tests Vitest: render saliente/entrante, branching del Timeline, condicionales de visibility/disabled del botón.
- [ ] E2E `tests/e2e/feat008/request-changes-single.spec.ts` cubre flujo end-to-end en offer single: brand pide cambios → card aparece en ambas pestañas → creator sube v2 (reusa `useDraftUploadFlow` FEAT-007) → brand aprueba.
- [ ] Validación visual Pencil ≥95% contra `a4UgN`, `txulr`, `nK6FB`, `H2DA6`, `BIuqZ`, `y54vb`, `Xu3OI` (light + dark).

## Done summary

Round limpio. Los issues del round anterior están resueltos. formatMessageDateTime centraliza y fija el locale. Guards de extractSnapshot correctos. Lógica isStale con fallback a snapshot.version es correcta y está testeada. showRequestChangesButton acotado a draft_submitted. aria-describedby + sr-only tooltip accesible. ChangeCategoryChip readOnly semánticamente correcto. Tests cubren todos los paths críticos.

## Evidence

- Commits:
- Tests:
- PRs:
